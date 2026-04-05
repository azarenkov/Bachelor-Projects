# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a university Bachelor's degree coursework monorepo. Each top-level directory corresponds to a course, and each `assignment-N` subdirectory is an independent project with its own dependencies and runtime.

```
Bachelor/
├── Advanced Programming 1/     # Go – concurrent HTTP server
├── Advanced Programming 2/     # Go – Clean Architecture microservices
├── Blockchain-1/               # Solidity / Hardhat (Remix IDE)
├── Blockchain-2/               # Solidity / Hardhat with Slither analysis
├── Computational Mathematics/  # Numerical methods (language varies)
├── Design and Analysis of Algorithms/  # Go / algorithm implementations
├── Object-Oriented Programming/        # OOP project (EndtermProj)
├── SRE/                        # Docker, Prometheus, Grafana, Alertmanager
└── WEB Technologies 2 (Back End)/     # Node.js / Express / MongoDB
```

---

## Go Projects (Advanced Programming 1 & 2, Design and Analysis of Algorithms)

### Run a service
```bash
go run ./cmd/<service-name>   # from the service root
```

### Run tests
```bash
go test ./...                 # all tests in a module
go test ./internal/usecase/... # single package
go test -race ./...           # with race detector
```

### Build
```bash
go build ./...
```

---

## Advanced Programming 2 – Order & Payment Platform

Two-service platform using **Clean Architecture**. Each service has its own PostgreSQL database.

### Layer structure (both services)
```
cmd/<service>/main.go     ← Composition Root
internal/
  domain/                 ← Pure Go entities, zero deps
  usecase/                ← Business rules + port interfaces
  repository/postgres/    ← SQL adapters
  transport/http/         ← Gin handlers
  app/app.go              ← Wiring
migrations/
```

### Env vars required

| Service | Variable | Example |
|---|---|---|
| order-service | `ORDER_DB_DSN` | `postgres://postgres:postgres@localhost:5432/order_db?sslmode=disable` |
| order-service | `ORDER_PORT` | `8080` |
| order-service | `PAYMENT_BASE_URL` | `http://localhost:8081` |
| payment-service | `PAYMENT_DB_DSN` | `postgres://postgres:postgres@localhost:5432/payment_db?sslmode=disable` |
| payment-service | `PAYMENT_PORT` | `8081` |

### Database setup
```bash
psql -d order_db   -f order-service/migrations/001_create_orders.sql
psql -d payment_db -f payment-service/migrations/001_create_payments.sql
```

### Business rules
- Money is always `int64` cents; `float64` is never used.
- Payments with `amount > 100_000` cents are auto-declined.
- Only `Pending` orders can be cancelled; `Paid` orders cannot.
- Payment Service timeout from Order Service: **2 seconds**.
- Idempotency via `Idempotency-Key` header on `POST /orders`.

---

## SRE – Monitoring Stack (assignment-3)

Prometheus + Grafana + Node Exporter + Alertmanager, all via Docker Compose.

```bash
cd SRE/assignment-3
docker compose up -d
```

| Service | URL |
|---|---|
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3000 (admin/admin) |
| Alertmanager | http://localhost:9093 |

Grafana dashboard ("Golden Signals – Node Exporter") is auto-provisioned. All PromQL recording rules follow the `<level>:<metric>:<operation>` naming convention.

### Prometheus snapshot backup
```bash
curl -XPOST http://localhost:9090/api/v1/admin/tsdb/snapshot
```

---

## Node.js Projects (WEB Technologies 2)

Each assignment is a standalone Express app.

```bash
cd "WEB Technologies 2 (Back End)"/assignment-N
npm install
npm start         # or: node server.js / node app.js
```

Assignment-3 (Blog API) and Assignment-4 (Analytics Platform) require MongoDB. Set `MONGODB_URI` or use the default `mongodb://localhost:27017/<dbname>`.

---

## Blockchain Projects

Both courses use **Hardhat** for compilation, testing, and deployment.

```bash
cd Blockchain-2/assignment-1   # or Blockchain-1/assignment-N
npm install
npx hardhat compile
npx hardhat test
npx hardhat run scripts/<deploy-script>.js --network <network>
```

Blockchain-2/assignment-1 includes a Slither static analysis report (`slither_report.json`).
