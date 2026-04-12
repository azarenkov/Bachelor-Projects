# SRE Midterm – Production-Ready Observability for the Analytical Platform

## Overview

This project containerises the **Analytical Platform** (time-series data visualisation app built with Node.js + MongoDB + Vanilla JS) that was developed for *WEB Technologies 2 (Back End)*. It adds a complete SRE observability stack on top: Prometheus, Grafana, Node Exporter, and Alertmanager – all orchestrated with Docker Compose.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser                                                        │
└──────────────────────┬──────────────────────────────────────────┘
                       │ :80
              ┌────────▼────────┐
              │   Frontend      │  nginx (static HTML/CSS/JS)
              │   :80           │  + reverse proxy /api/* → backend
              └────────┬────────┘
                       │ :3000
              ┌────────▼────────┐
              │   Backend       │  Node.js / Express
              │   :3000         │  • /api/measurements/*
              │                 │  • /metrics  (Prometheus scrape)
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │   MongoDB       │  mongo:7
              │   :27017        │
              └─────────────────┘

Observability
              ┌─────────────────┐    ┌─────────────────┐
              │   Prometheus    │───▶│   Alertmanager  │
              │   :9090         │    │   :9093         │
              └────────┬────────┘    └─────────────────┘
                       │
              ┌────────▼────────┐
              │   Grafana       │
              │   :3001         │
              └─────────────────┘

              ┌─────────────────┐
              │   Node Exporter │  host-level metrics
              │   :9100         │
              └─────────────────┘
```

---

## Step 1 – Running the Stack

### Prerequisites

- Docker Engine ≥ 24 and Docker Compose v2

### Start all services

```bash
cd SRE/midterm
docker compose up -d --build
```

### Seed the database (first run)

```bash
docker compose exec backend node seed.js
```

### Service URLs

| Service | URL | Credentials |
|---|---|---|
| Web Application | http://localhost | – |
| Backend API | http://localhost:3000/api | – |
| Prometheus | http://localhost:9090 | – |
| Grafana | http://localhost:3001 | admin / admin |
| Alertmanager | http://localhost:9093 | – |
| Node Exporter | http://localhost:9100/metrics | – |

### Stop

```bash
docker compose down
```

---

## Step 2 – SLI, SLO & Error Budget

### SLI 1 – Availability

**Definition:** The proportion of HTTP requests to the backend API that return a non-5xx response.

```
SLI_availability = successful_requests / total_requests
                 = count(http_status != 5xx) / count(all requests)
```

**PromQL (Prometheus expression):**

```promql
(
  sum(rate(http_requests_total{job="analytical-platform", status_code!~"5.."}[5m]))
  /
  sum(rate(http_requests_total{job="analytical-platform"}[5m]))
) * 100
```

**SLO:** ≥ **99.5%** of requests per calendar month succeed.

#### Monthly Error Budget Calculation

| Parameter | Value |
|---|---|
| SLO target | 99.5% |
| Allowed error rate | 0.5% |
| Minutes in a month | 30 days × 24 h × 60 min = **43,200 min** |
| Error budget (time) | 0.5% × 43,200 = **216 minutes** of allowable downtime/errors |
| Error budget (requests) | 0.5% of total requests |

*Example:* At 10 req/s, the monthly request volume = 10 × 43,200 × 60 = **25,920,000 requests**.
Allowed failures = 0.5% × 25,920,000 = **129,600 requests** before the SLO is breached.

---

### SLI 2 – Request Latency

**Definition:** The proportion of HTTP requests that complete within **500 ms** (p95 SLO boundary).

```
SLI_latency = count(request_duration < 500 ms) / count(all requests)
```

**PromQL (p95 latency):**

```promql
histogram_quantile(
  0.95,
  sum(rate(http_request_duration_seconds_bucket{job="analytical-platform"}[5m])) by (le)
)
```

**SLO:** The **95th-percentile** response time must be ≤ **500 ms** per calendar month.

#### Monthly Error Budget Calculation

| Parameter | Value |
|---|---|
| SLO target | 95% of requests ≤ 500 ms |
| Allowed slow requests | 5% |
| Burn rate before SLO breach | Once 5% of monthly requests exceed 500 ms |
| At 10 req/s, monthly requests | 25,920,000 |
| Allowed slow requests | 5% × 25,920,000 = **1,296,000 slow requests** |

---

## Step 3 – Grafana Dashboard

The dashboard **"Analytical Platform – Golden Signals & SLO"** is auto-provisioned at Grafana startup (no manual import required). It is located under the folder **SRE Midterm**.

### Panels

| Row | Panel | Signal |
|---|---|---|
| SLO Overview | Availability % (stat) | – |
| SLO Overview | p95 Latency (stat) | – |
| SLO Overview | Current Error Rate % (stat) | – |
| SLO Overview | Backend Uptime (stat) | – |
| Traffic | Request Rate by Route | Traffic |
| Traffic | Request Rate by Status Code | Traffic |
| Latency | p50 / p95 / p99 latency | Latency |
| Latency | Node.js Event-Loop Lag | Latency |
| Errors | API Error Rate % | Errors |
| Errors | 5xx Errors by Route | Errors |
| Saturation | Node.js Memory Usage | Saturation |
| Saturation | Host CPU & Memory | Saturation |

---

## Step 4 – Alerting

### Alert Rules (`prometheus/alert_rules.yml`)

| Alert | Condition | Severity | Duration | SLO |
|---|---|---|---|---|
| `HighApiErrorRateWarning` | 5xx rate > 0.5% | warning | 2 m | Availability |
| `HighApiErrorRateCritical` | 5xx rate > 5% | critical | 1 m | Availability |
| `HighApiLatencyWarning` | p95 > 500 ms | warning | 2 m | Latency |
| `HighApiLatencyCritical` | p95 > 1 s | critical | 1 m | Latency |
| `AnalyticalPlatformDown` | `up == 0` | critical | 1 m | – |
| `HighCpuUsageWarning` | CPU > 75% | warning | 2 m | – |
| `HighCpuUsageCritical` | CPU > 90% | critical | 1 m | – |
| `HighMemoryUsageWarning` | Mem > 80% | warning | 2 m | – |
| `HighMemoryUsageCritical` | Mem > 95% | critical | 1 m | – |

### Triggering an alert manually

To trigger the **`AnalyticalPlatformDown`** (critical) alert:

```bash
# Stop the backend container
docker compose stop backend

# Wait ~1 minute, then check Prometheus → Alerts tab
# http://localhost:9090/alerts
# The alert will transition: PENDING → FIRING

# Restore the backend
docker compose start backend
```

To trigger **`HighApiErrorRateCritical`** you can temporarily route all requests to a non-existent MongoDB collection (causing 500s) or use an HTTP load generator:

```bash
# Install hey (HTTP load generator) or use curl in a loop
for i in $(seq 1 200); do
  curl -s "http://localhost:3000/api/measurements?field=nonexistent" > /dev/null
done
# This causes 400 responses; for 5xx, temporarily break the DB connection:
docker compose stop mongodb
# Then send requests – all /api/measurements calls will 500
```

---

## BONUS – Docker Swarm deployment

### Initialise a single-node swarm

```bash
docker swarm init
```

### Deploy the stack

```bash
docker stack deploy -c docker-compose.yml analytical-platform
```

### Verify services

```bash
docker stack services analytical-platform
docker stack ps analytical-platform
```

### Scale the backend

```bash
docker service scale analytical-platform_backend=3
```

### Remove the stack

```bash
docker stack rm analytical-platform
docker swarm leave --force
```

---

## File Structure

```
SRE/midterm/
├── app/                         # Node.js backend + static frontend
│   ├── Dockerfile
│   ├── index.js                 # Express app with prom-client metrics
│   ├── package.json
│   ├── models/Measurement.js
│   ├── routes/measurements.js
│   ├── public/                  # Static HTML/CSS/JS served by nginx
│   └── seed.js
├── frontend/
│   ├── Dockerfile               # nginx image
│   └── nginx.conf               # Static files + /api proxy
├── prometheus/
│   ├── prometheus.yml
│   └── alert_rules.yml
├── grafana/
│   └── provisioning/
│       ├── datasources/datasource.yml
│       └── dashboards/
│           ├── dashboard.yml
│           └── golden_signals.json
├── alertmanager/
│   └── alertmanager.yml
├── docker-compose.yml
└── README.md
```
