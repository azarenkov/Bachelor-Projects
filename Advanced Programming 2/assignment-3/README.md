# Assignment 3 — Event-Driven Architecture (RabbitMQ)

## Architecture

```
                +---------+    HTTP    +---------------+   gRPC    +-----------------+
                |  Client | ---------> | order-service | --------> | payment-service |
                +---------+            +-------+-------+           +--------+--------+
                                               |                            |
                                               | SQL                        | SQL
                                               v                            v
                                          [order-db]                   [payment-db]
                                                                            |
                                                          publish payment.completed (persistent)
                                                                            v
                                            +-------------------------------------------------------+
                                            |                       RabbitMQ                        |
                                            |                                                       |
                                            |   exchange "payments" (topic, durable)                |
                                            |          |                                            |
                                            |          v                                            |
                                            |   queue "notifications.payment_completed"             |
                                            |     (durable, manual ACK,                             |
                                            |      x-dead-letter-exchange = payments.dlx)           |
                                            |          |                                            |
                                            |          | NACK x3                                    |
                                            |          v                                            |
                                            |   exchange "payments.dlx" -> queue                    |
                                            |   "notifications.payment_completed.dlq"               |
                                            +-------------------------------------------------------+
                                                                            |
                                                                            v
                                                                  +----------------------+
                                                                  | notification-service |
                                                                  | (consumer, manual    |
                                                                  |  ACK, idempotent)    |
                                                                  +----------------------+
```

## Services

| Service | Role | Port |
|---|---|---|
| `order-service` | Receives REST orders, calls payment via gRPC | `8080` HTTP, `9090` gRPC |
| `payment-service` | Authorizes payments, publishes `payment.completed` to RabbitMQ | `9091` gRPC |
| `notification-service` | Consumes `payment.completed`, simulates email | — (worker) |
| `rabbitmq` | Message broker (with management UI) | `5672` AMQP, `15672` UI |
| `order-db`, `payment-db` | Postgres 16 | `5432`, `5433` |

## Event flow

1. `POST /orders` arrives at `order-service` with a JSON body that includes `customer_email`.
2. `order-service` persists the order, then calls `payment-service` via gRPC, passing `order_id`, `amount`, `customer_email`.
3. `payment-service`:
   - opens a DB transaction, inserts the payment row, commits.
   - **after commit**, publishes a `payment.completed` event (JSON) to the `payments` topic exchange with routing key `payment.completed`. Publishing uses **publisher confirms** (`channel.Confirm` + `WaitContext`), so the producer only treats the event as sent when the broker has acknowledged it.
4. RabbitMQ routes the event to the durable queue `notifications.payment_completed`.
5. `notification-service` consumes the message **with auto-ack disabled**, calls the `Notifier`, and `Ack`s only after the email log line is printed.

The expected log output of the consumer:

```
[Notification] Sent email to alice@example.com for Order #<order-uuid>. Amount: $49.99 (status=Authorized, tx=<tx-uuid>)
```

## Reliability & delivery guarantees

### Manual ACKs (Lecture 5 / Lecture 6)

- The consumer calls `channel.Consume(..., autoAck=false, ...)`.
- It only `d.Ack(false)` after the notifier returned `nil`.
- If the notifier fails, the consumer calls `d.Nack(false, requeue=false)`. The queue is configured with `x-dead-letter-exchange`, so the broker re-routes the rejected message to the DLX.
- If the consumer process crashes mid-processing, the unacked message is automatically redelivered when the connection is closed (at-least-once delivery).

### Persistence

- Producer publishes with `delivery_mode = 2` (`amqp.Persistent`) and a server-side timestamp.
- Exchange `payments` and queue `notifications.payment_completed` are declared `durable=true`.
- DLX exchange `payments.dlx` and DLQ `notifications.payment_completed.dlq` are also `durable=true`.
- A broker restart does not lose any persistent message that has reached a durable queue.

### Idempotency

Every event carries a unique `message_id` (UUIDv4) generated by the producer (also set as the AMQP `message-id` property).

The consumer keeps an in-memory `idempotency.Store` (a `map[string]struct{}` guarded by a mutex):

- Before processing, it checks `store.Has(messageID)`. If `true`, it logs `duplicate message_id=... — acking without re-processing` and ACKs the message immediately. The notifier is **not** called, so the email is never sent twice.
- After a successful `Notify`, it calls `store.MarkProcessed(messageID)`.

For an assignment-grade solution we use an in-memory store. In production this would be replaced with a Postgres table (`processed_events(message_id PK, processed_at)`) or Redis, but the contract is identical.

## Bonus: Retries & DLQ

The main queue is declared with these arguments:

```go
amqp.Table{
    "x-dead-letter-exchange":    "payments.dlx",
    "x-dead-letter-routing-key": "payment.completed",
}
```

Retry policy: **3 delivery attempts**. After each `Nack(requeue=false)` the broker dead-letters the message; we re-attempt by binding the DLX back into the consumer's processing path. The consumer inspects the `x-death` header on incoming deliveries and rejects-without-requeue once `count >= MaxDeliveryAttempts (3)`, which lands the message permanently in `notifications.payment_completed.dlq`.

To **demonstrate the DLQ** end-to-end, run with `NOTIFY_FAIL_DOMAIN=poison.test` on `notification-service` and post an order with `customer_email: "user@poison.test"`. The consumer will fail every delivery, you'll see attempt logs, and the message will appear in the RabbitMQ UI under `notifications.payment_completed.dlq`:

```bash
NOTIFY_FAIL_DOMAIN=poison.test docker compose up --build
curl -X POST http://localhost:8080/orders \
  -H 'Content-Type: application/json' \
  -d '{"customer_id":"c1","item_name":"book","amount":4999,"customer_email":"poison@poison.test"}'
# open http://localhost:15672 (guest/guest) and inspect the DLQ
```

## Graceful shutdown

All three services trap `SIGINT`/`SIGTERM` via `os/signal`:

- `order-service`, `payment-service`: `grpc.GracefulStop()`, then close DB / publisher / payment client.
- `notification-service`: cancels the consumer's `context.Context`, waits for the `Run` goroutine to return, then closes the channel and connection.

`docker compose down` stops cleanly without losing in-flight messages: any unacked delivery is requeued by the broker.

## Running

```bash
cd "Advanced Programming 2/assignment-3"
docker compose up --build
```

| Endpoint | URL |
|---|---|
| Order REST | http://localhost:8080 |
| RabbitMQ UI | http://localhost:15672 (guest/guest) |
| Order gRPC | localhost:9090 |
| Payment gRPC | localhost:9091 |

Send an order:

```bash
curl -X POST http://localhost:8080/orders \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: demo-1' \
  -d '{"customer_id":"c1","item_name":"book","amount":4999,"customer_email":"alice@example.com"}'
```

Watch the notification:

```bash
docker compose logs -f notification-service
```

## Environment variables

| Service | Variable | Default |
|---|---|---|
| order-service | `ORDER_DB_DSN` | `postgres://postgres:postgres@order-db:5432/order_db?sslmode=disable` |
| order-service | `ORDER_PORT` / `ORDER_GRPC_PORT` | `8080` / `9090` |
| order-service | `PAYMENT_GRPC_ADDR` | `payment-service:9091` |
| payment-service | `PAYMENT_DB_DSN` | `postgres://postgres:postgres@payment-db:5432/payment_db?sslmode=disable` |
| payment-service | `PAYMENT_GRPC_PORT` | `9091` |
| payment-service | `RABBITMQ_URL` | `amqp://guest:guest@rabbitmq:5672/` |
| notification-service | `RABBITMQ_URL` | `amqp://guest:guest@rabbitmq:5672/` |
| notification-service | `NOTIFY_FAIL_DOMAIN` | `""` (set to e.g. `poison.test` for DLQ demo) |

## Regenerating proto code

```bash
export PATH="$PATH:$(go env GOPATH)/bin"
protoc --proto_path=proto \
  --go_out=gen --go_opt=paths=source_relative \
  --go-grpc_out=gen --go-grpc_opt=paths=source_relative \
  payment/v1/payment.proto order/v1/order.proto
```

## Project layout

```
assignment-3/
├── docker-compose.yml
├── events/                       # shared Go module: PaymentCompletedEvent + queue/exchange constants
├── gen/                          # generated proto code (Go module)
├── proto/                        # *.proto sources
├── order-service/                # REST + gRPC, calls payment-service
├── payment-service/              # gRPC server + RabbitMQ publisher
└── notification-service/         # RabbitMQ consumer (idempotent, manual ACK, DLQ-aware)
```

## Business rules (unchanged from Assignments 1 & 2)

- Money is `int64` cents.
- `amount > 100_000` is auto-declined.
- Only `Pending` orders can be cancelled.
- `Idempotency-Key` header is honored on `POST /orders`.
