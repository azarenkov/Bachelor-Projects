# Advanced Programming 2 – Assignment 1: Order & Payment Platform

A two-service platform built with **Clean Architecture**, **REST communication**, and **PostgreSQL** persistence.

---

## Services

| Service | Port | Database |
|---|---|---|
| Order Service | 8080 | `order_db` |
| Payment Service | 8081 | `payment_db` |

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Client (curl / Postman)          │
└───────────────────┬────────────────────┬─────────┘
                    │ REST               │ REST
                    ▼                    ▼
         ┌──────────────────┐  ┌─────────────────────┐
         │   Order Service  │  │   Payment Service   │
         │                  │  │                     │
         │  ┌────────────┐  │  │  ┌───────────────┐  │
         │  │  Handler   │  │  │  │   Handler     │  │
         │  │ (Gin HTTP) │  │  │  │  (Gin HTTP)   │  │
         │  └─────┬──────┘  │  │  └──────┬────────┘  │
         │        │          │  │         │           │
         │  ┌─────▼──────┐  │  │  ┌──────▼────────┐  │
         │  │  UseCase   │  │──┼──►  UseCase      │  │
         │  └─────┬──────┘  │  │  └──────┬────────┘  │
         │        │ Port     │  │         │ Port      │
         │  ┌─────▼──────┐  │  │  ┌──────▼────────┐  │
         │  │ Repository │  │  │  │  Repository   │  │
         │  └─────┬──────┘  │  │  └──────┬────────┘  │
         │        │          │  │         │           │
         │  ┌─────▼──────┐  │  │  ┌──────▼────────┐  │
         │  │ PostgreSQL  │  │  │  │  PostgreSQL   │  │
         │  │  order_db  │  │  │  │  payment_db   │  │
         │  └────────────┘  │  │  └───────────────┘  │
         └──────────────────┘  └─────────────────────┘
```

### Layer Responsibilities

| Layer | Responsibility |
|---|---|
| **Domain** | Pure Go structs & invariants; zero framework/HTTP deps |
| **UseCase** | Business rules, state transitions, interface (port) definitions |
| **Repository** | SQL queries via `database/sql`; implements the repository port |
| **Transport/HTTP** | Gin handlers: parse request → call use-case → encode response |
| **App** | Composition Root: wires all deps together in `main.go` |

---

## Bounded Contexts

### Order Context
- Owns `orders` and `idempotency_keys` tables in `order_db`.
- Responsible for order lifecycle: `Pending → Paid | Failed | Cancelled`.
- Calls Payment Service over REST to authorize payment.

### Payment Context
- Owns `payments` table in `payment_db`.
- Responsible for authorizing/declining a payment and recording the transaction.
- Has **no knowledge** of the Order domain model.

---

## Business Rules

1. **Amount must be `int64` in cents** – `float64` is never used for money.
2. `amount > 0` is enforced at the domain level (`domain.NewOrder`).
3. Payments with `amount > 100 000` cents ($1 000) are automatically **Declined**.
4. Only **Pending** orders can be **Cancelled** (enforced inside `Order.Cancel()`).
5. A **Paid** order cannot be cancelled.

---

## Failure Handling

| Scenario | Behaviour |
|---|---|
| Payment Service is down / slow | Order Service HTTP client has a **2-second timeout**. Request fails, order is marked `Failed`, caller receives `503 Service Unavailable`. |
| Payment Service returns `Declined` | Order is marked `Failed`. |
| Invalid amount (≤ 0) | `400 Bad Request` before any DB write. |
| Order not found | `404 Not Found`. |
| Cancel non-Pending order | `409 Conflict`. |

**Choice of failure state:** The Order is marked `Failed` (not `Pending`) when the Payment Service is unavailable. Rationale: leaving it as `Pending` would imply retries are expected, which the spec does not require and would complicate UX. `Failed` is unambiguous and matches the "payment was not processed" semantic.

---

## Idempotency (Bonus)

Supply an `Idempotency-Key: <uuid>` header on `POST /orders`. The Order Service stores the key in a dedicated `idempotency_keys` table. If the same key is sent again, the existing order is returned instead of creating a duplicate.

The Payment Service is also idempotent for `POST /payments` — it returns the existing payment if the `order_id` already exists (`UNIQUE` constraint).

---

## Running Locally

### Prerequisites
- Go 1.21+
- PostgreSQL 14+

### 1 – Create databases and run migrations

```sql
-- Run in psql:
CREATE DATABASE order_db;
CREATE DATABASE payment_db;
```

```bash
psql -d order_db   -f order-service/migrations/001_create_orders.sql
psql -d payment_db -f payment-service/migrations/001_create_payments.sql
```

### 2 – Start Payment Service

```bash
cd payment-service
PAYMENT_DB_DSN="postgres://postgres:postgres@localhost:5432/payment_db?sslmode=disable" \
PAYMENT_PORT=8081 \
go run ./cmd/payment-service
```

### 3 – Start Order Service

```bash
cd order-service
ORDER_DB_DSN="postgres://postgres:postgres@localhost:5432/order_db?sslmode=disable" \
ORDER_PORT=8080 \
PAYMENT_BASE_URL=http://localhost:8081 \
go run ./cmd/order-service
```

---

## API Examples

### Create an order (success)

```bash
curl -X POST http://localhost:8080/orders \
  -H "Content-Type: application/json" \
  -d '{"customer_id":"cust-1","item_name":"Widget","amount":5000}'
```

```json
{"id":"...","customer_id":"cust-1","item_name":"Widget","amount":5000,"status":"Paid","created_at":"2024-01-01T00:00:00Z"}
```

### Create an order (payment declined – amount > 100 000)

```bash
curl -X POST http://localhost:8080/orders \
  -H "Content-Type: application/json" \
  -d '{"customer_id":"cust-1","item_name":"Expensive","amount":150000}'
```

```json
{"id":"...","status":"Failed","amount":150000,...}
```

### Get an order

```bash
curl http://localhost:8080/orders/<id>
```

### Cancel an order

```bash
curl -X PATCH http://localhost:8080/orders/<id>/cancel
```

### Idempotent order creation

```bash
curl -X POST http://localhost:8080/orders \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: key-abc-123" \
  -d '{"customer_id":"cust-1","item_name":"Widget","amount":5000}'
# Second call with the same key returns the original order without creating a new one.
```

### Get payment by order ID

```bash
curl http://localhost:8081/payments/<order_id>
```

---

## Project Structure

```
assignment-1/
├── order-service/
│   ├── cmd/order-service/main.go        # Composition Root
│   ├── internal/
│   │   ├── domain/order.go              # Entity, invariants
│   │   ├── usecase/order_usecase.go     # Business logic + ports
│   │   ├── repository/postgres/         # PostgreSQL adapter
│   │   ├── transport/http/              # Gin handlers + PaymentClient
│   │   └── app/app.go                   # Wiring
│   └── migrations/001_create_orders.sql
│
└── payment-service/
    ├── cmd/payment-service/main.go       # Composition Root
    ├── internal/
    │   ├── domain/payment.go            # Entity, constants
    │   ├── usecase/payment_usecase.go   # Business logic + ports
    │   ├── repository/postgres/         # PostgreSQL adapter
    │   ├── transport/http/              # Gin handlers
    │   └── app/app.go                   # Wiring
    └── migrations/001_create_payments.sql
```
