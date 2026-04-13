# Assignment 2 — gRPC Migration

Migration of Assignment 1 (REST microservices) to gRPC.

## Architecture

Two services communicate via gRPC instead of HTTP:

| Service | REST (external) | gRPC (internal) |
|---|---|---|
| **order-service** | `POST /orders`, `GET /orders/:id`, `PATCH /orders/:id/cancel`, `GET /orders/recent` | `OrderService.SubscribeToOrderUpdates` (server-streaming) |
| **payment-service** | — | `PaymentService.ProcessPayment` (unary) |

## Proto Definitions

- `proto/payment/v1/payment.proto` — `ProcessPayment` unary RPC
- `proto/order/v1/order.proto` — `SubscribeToOrderUpdates` server-streaming RPC

Generated Go code lives in `gen/` (module `github.com/azarenkov/ap2-gen`).

## Environment Variables

| Service | Variable | Default |
|---|---|---|
| order-service | `ORDER_DB_DSN` | `postgres://postgres:postgres@localhost:5432/order_db?sslmode=disable` |
| order-service | `ORDER_PORT` | `8080` |
| order-service | `ORDER_GRPC_PORT` | `9090` |
| order-service | `PAYMENT_GRPC_ADDR` | `localhost:9091` |
| payment-service | `PAYMENT_DB_DSN` | `postgres://postgres:postgres@localhost:5432/payment_db?sslmode=disable` |
| payment-service | `PAYMENT_GRPC_PORT` | `9091` |

## Running with Docker Compose

```bash
docker compose up -d
```

| Endpoint | URL |
|---|---|
| Order Service REST API | http://localhost:8080 |
| Order Service gRPC | localhost:9090 |
| Payment Service gRPC | localhost:9091 |

## Regenerating Proto Code

```bash
export PATH="$PATH:$(go env GOPATH)/bin"
protoc --proto_path=proto \
  --go_out=gen --go_opt=paths=source_relative \
  --go-grpc_out=gen --go-grpc_opt=paths=source_relative \
  payment/v1/payment.proto order/v1/order.proto
```

## Building Locally

```bash
cd order-service && go build ./...
cd ../payment-service && go build ./...
```

## Business Rules (unchanged from Assignment 1)

- Money is always `int64` cents; `float64` is never used.
- Payments with `amount > 100_000` cents are auto-declined.
- Only `Pending` orders can be cancelled.
- Idempotency via `Idempotency-Key` header on `POST /orders`.
