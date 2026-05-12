# Assignment 4 — Performance Optimization & External Integrations

Final assignment of the AP2 microservices arc. Builds on Assignment 3
(RabbitMQ event-driven flow) and adds:

1. **Redis cache-aside** in the Order Service (with TTL + invalidation on writes).
2. **Adapter Pattern** for the email provider in the Notification Service
   (Mock simulating latency/failures, or real SMTP — env-switchable).
3. **Reliable background worker** with **Redis idempotency by `payment_id`**
   and **exponential backoff** (2s, 4s, 8s) instead of broker-level retries.
4. **Bonus:** Redis-backed **rate limiter** middleware on the Order Service.

## Architecture

```
                +---------+    HTTP    +---------------+   gRPC    +-----------------+
                |  Client | ─────────▶ | order-service | ────────▶ | payment-service |
                +---------+            +-------+-------+           +────────┬────────+
                                               │ SQL                       │ SQL
                                               ▼                           ▼
                                          [order-db]                 [payment-db]
                                               │
            cache lookup / invalidate          │
                       │                       │ publish payment.completed (durable)
                       ▼                       ▼
                +─────────────+      +──────────────────+
                │   Redis     │      │     RabbitMQ     │
                │             │      │  exchange:       │
                │ order:<id>  │      │  payments (topic)│
                │ ratelimit:* │      │  queue:          │
                │ notif:      │      │  notifications.* │
                │  payment:*  │      │  + DLQ           │
                +────┬────────+      +────────┬─────────+
                     │ idempotency           │ consume (manual ACK)
                     │ checks                ▼
                     │              +──────────────────────+
                     └──────────────│ notification-service │
                                    │  retry (exp backoff) │
                                    │  EmailSender         │
                                    │  ├ Mock (default)    │
                                    │  └ SMTP (PROVIDER_   │
                                    │      MODE=REAL)      │
                                    +──────────────────────+
```

## Services

| Service | Role | Port |
|---|---|---|
| `order-service` | REST + gRPC, cache-aside via Redis, rate-limit middleware | 8080 HTTP, 9090 gRPC |
| `payment-service` | gRPC, publishes `payment.completed` to RabbitMQ | 9091 gRPC |
| `notification-service` | RabbitMQ consumer, idempotency in Redis, retry w/ exp backoff, pluggable EmailSender | — (worker) |
| `redis` | Cache (`order:*`), idempotency (`notif:payment:*`), rate limiter (`ratelimit:*`) | 6379 |
| `rabbitmq` | Broker | 5672 AMQP, 15672 UI |
| `order-db`, `payment-db` | Postgres 16 | 5432, 5433 |

## 1. Caching — cache-aside (Lecture 7)

`order-service/internal/cache/order_cache.go` declares a `RedisOrderCache` with:
- `GetOrder(ctx, id)` — returns `ErrCacheMiss` when key absent.
- `SetOrder(ctx, *Order)` — `SET <key> <json> EX <TTL>`.
- `Invalidate(ctx, id)` — `DEL <key>`.

Used by `OrderUseCase`:

| Path | Cache action |
|---|---|
| `GET /orders/:id` | **Read-through**: Redis first; on miss → DB then write-back |
| `POST /orders` | After payment + DB status update → **Invalidate** |
| `PATCH /orders/:id/cancel` | After DB status update → **Invalidate** |

TTL is configurable via `ORDER_CACHE_TTL` (default **5 min**). Cache errors never
block business logic — they're logged and the call degrades to the DB.

**Invalidation strategy:** every code path that mutates `orders.status` calls
`cache.Invalidate(id)` *immediately after* the commit. We deliberately invalidate
(DEL) rather than overwrite (SET) — this avoids the classic stale-write race
where two concurrent writers would otherwise leave the slower one's value in cache.

## 2. Background worker — adapter, idempotency, retry (Lectures 8–9)

### Adapter pattern (`notification-service/internal/provider/`)

```go
type EmailSender interface {
    Send(ctx context.Context, evt events.PaymentCompletedEvent) error
    Name() string
}
```

| Implementation | When | Behaviour |
|---|---|---|
| `MockSender` | `PROVIDER_MODE=SIMULATED` (default) | Random latency `100–400ms` + injectable failure rate (`NOTIFY_FAILURE_RATE`) + poison-domain (`NOTIFY_FAIL_DOMAIN`) → permanent error |
| `SMTPSender` | `PROVIDER_MODE=REAL` | Plain `net/smtp` PlainAuth against `SMTP_HOST/PORT/USERNAME/PASSWORD/FROM` |

The use case (consumer) only knows the interface; swapping the adapter is one env var.

### Idempotency by `payment_id` (Redis)

`notification-service/internal/idempotency/store.go`:

```go
type Store interface {
    Has(ctx, key string) (bool, error)
    MarkProcessed(ctx, key string) (newlyProcessed bool, err error)
}
```

The Redis implementation uses `EXISTS notif:payment:<id>` for `Has`, and atomic
`SETNX notif:payment:<id> <timestamp> EX <TTL>` for `MarkProcessed`. The TTL is
`NOTIFY_IDEMPOTENCY_TTL` (default **24h**) — long enough to outlive any retry
storm, short enough to avoid permanent state growth.

The key is the **`transaction_id`** from the event (one transaction → at most
one notification, regardless of how many times the event is redelivered).

### Retry with exponential backoff

`notification-service/internal/retry/backoff.go` runs an operation up to
`MaxAttempts` times with backoff `initial × multiplier^(n-1)`, capped at
`MaxBackoff`. Defaults: `2s → 4s → 8s`, max 30s.

```
RETRY_MAX_ATTEMPTS=3
RETRY_INITIAL_BACKOFF=2s
RETRY_MAX_BACKOFF=30s
```

If every attempt fails the consumer publishes the message to
`notifications.payment_completed.dlq` and ACKs from the main queue. The
RabbitMQ DLX-based retry loop from Assignment 3 was removed — retries now live
**inside the worker** so they're observable in service logs and the broker's
queue depth stays a clean signal.

### Workflow inside one job (consumer.handle)

```
1. Unmarshal payload                  → if bad → DLQ
2. idem.Has(transaction_id)           → if true → ACK, skip
3. retry.Do(send via EmailSender)     → up to MaxAttempts with backoff
   ├─ all attempts fail               → DLQ, ACK
   └─ success                         → MarkProcessed(transaction_id), ACK
```

Verified end-to-end with `NOTIFY_FAILURE_RATE=0.7 RETRY_INITIAL_BACKOFF=500ms`:

```
attempt 1/3 failed: simulated transient provider error — retrying in 500ms
attempt 2/3 failed: simulated transient provider error — retrying in 1s
[Notification] Sent email to u6@example.com for Order #...
succeeded on attempt 3/3
```

and for permanent failures:

```
failed after 3 attempts: simulated transient provider error
permanent failure for payment=... — moving to DLQ
```

## 3. Bonus — Redis rate limiter

`order-service/internal/transport/http/middleware/ratelimit.go` keeps a counter
per client IP in Redis with `INCR` + `EXPIRE` on the first hit, returning
`HTTP 429 Too Many Requests` once the count crosses the limit. Defaults
`ORDER_RATE_LIMIT=30` per `ORDER_RATE_LIMIT_WINDOW=1m`.

Observed in a quick burst with `ORDER_RATE_LIMIT=10`:

```
req 1..9   -> 200
req 10..15 -> 429
```

Set `ORDER_RATE_LIMIT=0` to disable the middleware entirely.

## Environment variables (see `.env`)

| Variable | Default | Where |
|---|---|---|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` | `postgres`/`postgres` | DBs |
| `REDIS_URL` | `redis://redis:6379/0` | both Go services |
| `ORDER_CACHE_TTL` | `5m` | order-service |
| `ORDER_RATE_LIMIT` | `30` | order-service |
| `ORDER_RATE_LIMIT_WINDOW` | `1m` | order-service |
| `PROVIDER_MODE` | `SIMULATED` | notification-service (`SIMULATED`/`REAL`) |
| `NOTIFY_FAILURE_RATE` | `0` (try `0.4`) | mock provider |
| `NOTIFY_FAIL_DOMAIN` | empty | mock provider, e.g. `poison.test` |
| `NOTIFY_IDEMPOTENCY_TTL` | `24h` | notification-service |
| `RETRY_MAX_ATTEMPTS` | `3` | retry policy |
| `RETRY_INITIAL_BACKOFF` | `2s` | retry policy |
| `RETRY_MAX_BACKOFF` | `30s` | retry policy |
| `SMTP_HOST` / `_PORT` / `_USERNAME` / `_PASSWORD` / `_FROM` | empty | SMTP adapter |

## Running

```bash
cd "Advanced Programming 2/assignment-4"
docker compose up --build
```

| Endpoint | URL |
|---|---|
| Order REST | http://localhost:8080 |
| RabbitMQ UI | http://localhost:15672 (`guest` / `guest`) |
| Redis CLI | `docker compose exec redis redis-cli` |
| Order gRPC | localhost:9090 |
| Payment gRPC | localhost:9091 |

### Demo recipe

```bash
# 1. Create order + cache-aside
RESP=$(curl -s -X POST http://localhost:8080/orders \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: demo-1' \
  -d '{"customer_id":"c1","item_name":"book","amount":4999,"customer_email":"alice@example.com"}')
ID=$(echo "$RESP" | jq -r .id)
curl -s http://localhost:8080/orders/$ID > /dev/null   # populates cache
docker compose exec redis redis-cli KEYS 'order:*'     # → order:<ID>

# 2. Notification retry — flip failure rate at runtime
NOTIFY_FAILURE_RATE=0.7 RETRY_INITIAL_BACKOFF=500ms \
  docker compose up -d --force-recreate notification-service
# POST a few more orders and watch worker logs:
docker compose logs -f notification-service

# 3. Idempotency record
docker compose exec redis redis-cli KEYS 'notif:payment:*'

# 4. Rate limiter
ORDER_RATE_LIMIT=10 docker compose up -d --force-recreate order-service
for i in $(seq 1 15); do
  curl -s -o /dev/null -w "%{http_code}\n" \
    'http://localhost:8080/orders/recent?limit=1'
done
# 9× 200, then 429
```

## Project layout

```
assignment-4/
├── docker-compose.yml       (+ Redis service)
├── .env                     (all knobs)
├── events/                  (shared event types)
├── gen/                     (proto-generated)
├── order-service/
│   └── internal/
│       ├── cache/order_cache.go                       ← cache-aside
│       ├── transport/http/middleware/ratelimit.go     ← rate limiter
│       └── usecase/order_usecase.go                   (wired with cache + invalidate)
├── payment-service/         (unchanged from a3)
└── notification-service/
    └── internal/
        ├── provider/                ← EmailSender + Mock + SMTP
        ├── idempotency/store.go     ← Redis SETNX by payment_id
        ├── retry/backoff.go         ← exponential backoff
        └── transport/rabbitmq/consumer.go  (rewritten around retry+idem)
```

## Inheritance from previous assignments

- **Assignment 1**: REST microservices.
- **Assignment 2**: replaced REST inter-service call with gRPC.
- **Assignment 3**: added RabbitMQ for `payment.completed` events (durable, manual ACK, DLQ via DLX).
- **Assignment 4 (this)**: moved retry/idempotency *into the worker* via Redis, added cache-aside + rate limiter, and put the email transport behind a pluggable adapter. The git history shows the whole progression.
