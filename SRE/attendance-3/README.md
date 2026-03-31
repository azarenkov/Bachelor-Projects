# Attendance 3: API Monitoring with Prometheus & Grafana

A complete observability stack for a simple Node.js/Express API, wired together with Docker Compose.

---

## Architecture

```
┌──────────────┐   /metrics    ┌─────────────────┐
│  Express API │ ◄─────────── │   Prometheus     │
│  (port 3000) │              │   (port 9090)    │
└──────────────┘              └────────┬─────────┘
       │                               │ alert rules
       │                      ┌────────▼─────────┐
       │                      │  Alertmanager    │
       │                      │  (port 9093)     │
       │                      └──────────────────┘
       │
       │              ┌─────────────────┐
       └─────────────►│    Grafana      │
                      │  (port 3001)    │
                      └─────────────────┘
```

| Service        | Image                    | Port |
|----------------|--------------------------|------|
| `api`          | custom (Node 20 Alpine)  | 3000 |
| `prometheus`   | `prom/prometheus:v2.51.2`| 9090 |
| `alertmanager` | `prom/alertmanager:v0.27`| 9093 |
| `grafana`      | `grafana/grafana:10.4.2` | 3001 |

---

## Metrics Collected

| Metric | Prometheus Name | Type |
|--------|----------------|------|
| **Request Rate** | `http_requests_total` | Counter |
| **Latency** | `http_request_duration_seconds` | Histogram |
| **Error Rate** | derived: `rate(http_requests_total{status_code=~"5.."}[5m]) / rate(http_requests_total[5m])` | — |

All metrics are labelled with `method`, `route`, and `status_code`.

---

## API Endpoints

| Route | Behaviour |
|-------|-----------|
| `GET /` | Health check (always 200) |
| `GET /api/items` | Returns a list of items (always 200) |
| `GET /api/orders` | Flaky – fails with 500 ~15% of the time |
| `GET /api/reports` | Slow – 200–1000 ms artificial delay |
| `GET /metrics` | Prometheus scrape endpoint |

---

## Quick Start

```bash
# 1. Start the full stack
docker compose up -d

# 2. Verify all containers are running
docker compose ps
```

| UI | URL | Credentials |
|----|-----|-------------|
| API | http://localhost:3000 | — |
| Prometheus | http://localhost:9090 | — |
| Alertmanager | http://localhost:9093 | — |
| Grafana | http://localhost:3001 | admin / admin |

---

## Step-by-Step Walkthrough

### Step 1 – Prometheus

Prometheus scrapes the API's `/metrics` endpoint every 15 seconds.  
Open http://localhost:9090/targets to confirm the `monitoring-api` target is **UP**.

### Step 2 – Grafana

Open http://localhost:3001 and log in with `admin / admin`.

### Step 3 – Data Source (auto-provisioned)

A Prometheus data source is automatically provisioned at startup via
`grafana/provisioning/datasources/prometheus.yml`.  
You can verify it under **Connections → Data sources → Prometheus**.

### Step 4 – Configure Target

The scrape target is defined in `prometheus/prometheus.yml`:

```yaml
scrape_configs:
  - job_name: "monitoring-api"
    static_configs:
      - targets: ["api:3000"]
    metrics_path: /metrics
```

### Step 5 – Dashboard

The **API Monitoring Dashboard** is automatically provisioned from
`grafana/provisioning/dashboards/api-monitoring.json`.  
Open it via **Dashboards → API Monitoring Dashboard**.

The dashboard contains:

| Panel | Description |
|-------|-------------|
| Request Rate (req/s) | Per-route throughput over time |
| Error Rate (%) | % of 5xx responses over time |
| P50/P95/P99 Latency | Histogram quantiles over time |
| Request Rate by Status Code | 2xx vs 5xx breakdown |
| Stat: Total Requests | Last 5 min count |
| Stat: Current Error Rate | Colour-coded (green/yellow/red) |
| Stat: P95 Latency | Colour-coded threshold indicator |
| Stat: API Uptime | Process uptime in seconds |

---

## Alert Rules

Defined in `prometheus/alert.rules.yml` and evaluated by Prometheus every 15 seconds.

| Alert | Condition | Duration | Severity |
|-------|-----------|----------|----------|
| `HighErrorRate` | Error rate > 5% | 5 min | critical |
| `HighLatency` | P95 latency > 1 s (per route) | 5 min | warning |
| `NoTraffic` | Request rate = 0 | 2 min | warning |

### Example: Generate Traffic to Trigger Alerts

```bash
# Bombard the flaky endpoint to push error rate above 5%
for i in $(seq 1 200); do curl -s http://localhost:3000/api/orders > /dev/null; done

# Check firing alerts in Prometheus
open http://localhost:9090/alerts

# Check alert state in Alertmanager
open http://localhost:9093
```

---

## Monitoring for Decision-Making

| Signal | Decision |
|--------|----------|
| Error rate > 5% for 5 min | Roll back the last deployment or scale out |
| P95 latency > 1 s | Investigate slow routes (`/api/reports`), add caching |
| Request rate drops to 0 | Service is down — restart containers or check load balancer |
| Sustained high error rate | Page on-call engineer, open incident |

---

## File Structure

```
SRE/attendance-3/
├── docker-compose.yml                          # Orchestrates all services
├── README.md                                   # This file
├── api/
│   ├── Dockerfile                              # Node 20-alpine container
│   ├── package.json                            # express + prom-client
│   └── index.js                               # Express API with /metrics
├── prometheus/
│   ├── prometheus.yml                          # Scrape config
│   └── alert.rules.yml                        # Alert rules
├── alertmanager/
│   └── alertmanager.yml                        # Alertmanager (null receiver)
└── grafana/
    └── provisioning/
        ├── datasources/
        │   └── prometheus.yml                  # Auto-provision Prometheus DS
        └── dashboards/
            ├── dashboard.yml                   # Dashboard provider config
            └── api-monitoring.json             # Pre-built dashboard
```

---

## Teardown

```bash
docker compose down -v   # Remove containers and named volumes
```
