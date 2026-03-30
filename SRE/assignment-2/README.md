# Assignment 2: Designing Service Level Indicators and Service Level Objectives

**Platform:** Shuup E-Commerce (multi-vendor marketplace built with Python/Django)  
**Role:** Site Reliability Engineer (SRE)

---

## Step 1: Define SLIs and SLOs

### SLI 1 — Availability (Homepage / Product Pages)

| | |
|---|---|
| **SLI** | Proportion of HTTP requests to `/` and `/products/` that return a 2xx or 3xx response |
| **SLO** | ≥ 99.5% availability measured over a rolling 30-day window |
| **Why chosen** | A customer who cannot load the homepage or browse products cannot make a purchase. Availability is the most fundamental measure of whether the service is usable at all. |
| **Threshold justification** | 99.5% allows ~3.6 h downtime/month — enough headroom for planned maintenance and minor incidents while still protecting revenue. Competitors in the e-commerce space commonly target 99.5–99.9%. |

### SLI 2 — Latency (Product Search P95 Response Time)

| | |
|---|---|
| **SLI** | 95th-percentile server-side response time for `GET /search/` requests |
| **SLO** | P95 latency ≤ 1 500 ms over a rolling 30-day window |
| **Why chosen** | Search is the primary discovery mechanism. Studies (Google, Amazon) show that each additional 100 ms of latency decreases conversion rates by ~1%. P95 protects the majority of users without being skewed by extreme outliers. |
| **Threshold justification** | 1 500 ms is the threshold at which users noticeably perceive a page as "slow." A tighter target (e.g. 500 ms) would be ideal but may be impractical without significant infrastructure investment for a Django/Postgres stack with large product catalogues. |

### SLI 3 — Business / Error Metric (Checkout Success Rate)

| | |
|---|---|
| **SLI** | Proportion of checkout attempts (`POST /checkout/payment/`) that complete with a success response (order created, payment processed) |
| **SLO** | ≥ 99.0% checkout success rate over a rolling 30-day window |
| **Why chosen** | Checkout failures directly translate to lost revenue and damaged customer trust. This metric ties reliability to a concrete business outcome. |
| **Threshold justification** | Payment processors typically have 99.0–99.5% uptime guarantees; setting the SLO at 99.0% aligns with upstream constraints while still catching degraded states early. |

### Why 100% Reliability Is Not a Good Target

Setting an SLO of 100% is counterproductive for several reasons:

1. **Impossible in practice.** Hardware, networks, third-party APIs, and software all fail occasionally. Chasing 100% creates false expectations.
2. **Extreme cost.** Each additional "9" of availability (e.g., 99.9% → 99.99%) typically requires exponentially more infrastructure and engineering effort.
3. **Eliminates the error budget.** An error budget of 0 means every deployment, experiment, or maintenance window is forbidden — development velocity collapses.
4. **Wrong incentives.** Teams optimising for 100% resist all change. SRE philosophy acknowledges that acceptable risk enables innovation.

---

## Step 2: Calculate Error Budgets

### Formulas

```
Error Budget (%) = 100% − SLO (%)

Monthly Error Budget (minutes) = (1 − SLO) × 30 days × 24 h × 60 min
                               = (1 − SLO) × 43 200 minutes

For request-based SLIs:
Monthly Error Budget (requests) = Total monthly requests × (1 − SLO)
```

### Calculations

Assuming **~1 000 000 checkout requests per month** and **~50 000 000 total HTTP requests per month**.

| SLO | Error Budget % | Allowed Downtime / Failed Requests per Month |
|-----|---------------|----------------------------------------------|
| Availability ≥ 99.5% | 0.5% | **216 minutes** (~3 h 36 min) of downtime |
| Latency P95 ≤ 1 500 ms | 5% of requests may exceed threshold | **2 500 000 slow requests** out of 50 M |
| Checkout Success ≥ 99.0% | 1.0% | **10 000 failed checkouts** out of 1 M |

#### Availability (detailed)

```
Error Budget = 100% − 99.5% = 0.5%
Allowed downtime = 0.005 × 43 200 min = 216 min ≈ 3 h 36 min / month
```

#### Latency (detailed)

```
Error Budget = 100% − 95% = 5%   (95th percentile target means 5% may exceed the threshold)
Slow requests allowed = 0.05 × 50 000 000 = 2 500 000 requests / month
```

#### Checkout Success (detailed)

```
Error Budget = 100% − 99.0% = 1.0%
Failed checkouts allowed = 0.01 × 1 000 000 = 10 000 failed checkouts / month
```

---

## Step 3: Multi-Container Setup (Docker Compose)

### Services

| Service | Image | Role |
|---------|-------|------|
| `web` | `nginx:alpine` | Serves the Shuup frontend on port 8080 |
| `db` | `postgres:15-alpine` | PostgreSQL database backend |

The `web` service declares `depends_on: db`, ensuring the database container starts before the web container.

### Run the stack

```bash
# Copy the example env file and set your credentials (never commit real secrets)
cp .env.example .env

# Start both containers in detached mode
docker-compose up -d

# Verify both containers are running
docker-compose ps
```

Expected output:

```
NAME          IMAGE              COMMAND                  STATUS          PORTS
shuup_db      postgres:15-alpine "docker-entrypoint.s…"  Up              5432/tcp
shuup_web     nginx:alpine       "/docker-entrypoint.…"  Up              0.0.0.0:8080->80/tcp
```

The web frontend is accessible at **http://localhost:8080**.

---

## Step 4: Cascading Failure Simulation

### Simulate database failure

```bash
# Stop the database container
docker stop shuup_db

# Observe the web container is still running but DB-dependent features fail
docker-compose ps

# Attempt to reach the frontend (static content still served by nginx)
curl -I http://localhost:8080

# Check web container logs for connection errors
docker logs shuup_web
```

### Expected behaviour

| Component | State after `docker stop shuup_db` |
|-----------|-----------------------------------|
| `shuup_db` | **Stopped / Exited** |
| `shuup_web` | **Still running** (nginx serves static pages) |
| Product search / Checkout | **Fails** — Django cannot connect to Postgres |
| Homepage (static HTML) | **Available** — no DB call required |

### Observation and analysis

This demonstrates **cascading failure**: the database is a hard dependency for any dynamic page.  
When the DB is unavailable:

- Pages requiring database queries (product listings, search, cart, checkout) return 500 errors.
- Static assets and error pages continue to be served by nginx.
- `depends_on` in Docker Compose only controls **startup order**, not runtime health — the web container does not automatically stop when the DB dies.

### Restore the stack

```bash
# Restart the database
docker-compose start db

# Verify both services are healthy again
docker-compose ps
```

---

## File Structure

```
SRE/assignment-2/
├── docker-compose.yml   # Multi-container setup (Step 3)
├── .env.example         # Template for credentials (copy to .env before running)
├── index.html           # Simple nginx frontend page
└── README.md            # This file — SLI/SLO analysis and simulation guide
```
