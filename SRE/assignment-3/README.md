# Assignment 3 – Monitoring and Alerting (SRE)

> **Stack**: Prometheus · Grafana · Node Exporter · Alertmanager  
> **Deployed with**: Docker Compose

---

## Directory Layout

```
assignment-3/
├── docker-compose.yml
├── prometheus/
│   ├── prometheus.yml          # Scrape configuration + rule file references
│   ├── alert_rules.yml         # Warning & Critical alert rules
│   └── recording_rules.yml     # Pre-computed recording rules
├── alertmanager/
│   └── alertmanager.yml        # Routing & receiver configuration
└── grafana/
    └── provisioning/
        ├── datasources/
        │   └── datasource.yml  # Auto-provision Prometheus data source
        └── dashboards/
            ├── dashboard.yml   # Dashboard provider config
            └── golden_signals.json  # Four Golden Signals dashboard
```

---

## Step 1 – Full Stack Deployment

### Start the stack

```bash
docker compose up -d
```

### Verify all targets are UP

Open **http://localhost:9090/targets**.  
You should see four targets in the `UP` state:

| Job            | Target                  |
|----------------|-------------------------|
| `prometheus`   | `localhost:9090`        |
| `node_exporter`| `node_exporter:9100`    |
| `alertmanager` | `alertmanager:9093`     |

---

## Step 2 – Grafana Dashboard (Four Golden Signals)

Open **http://localhost:3000** (admin / admin).

The dashboard **"Golden Signals – Node Exporter"** is provisioned automatically and contains:

| Panel | Golden Signal | PromQL used |
|-------|--------------|-------------|
| CPU I/O Wait | **Latency** | `rate(node_cpu_seconds_total{mode="iowait"}[5m])` |
| Disk Latency | **Latency** | `rate(node_disk_read_time_seconds_total[5m]) / rate(node_disk_reads_completed_total[5m])` |
| Network Traffic | **Traffic** | `instance:node_network_receive_bytes:rate5m` (recording rule) |
| Disk I/O Traffic | **Traffic** | `instance:node_disk_read_bytes:rate5m` (recording rule) |
| Network Errors | **Errors** | `rate(node_network_receive_errs_total[5m])` |
| Disk I/O Errors | **Errors** | `rate(node_disk_io_time_weighted_seconds_total[5m])` |
| CPU Saturation | **Saturation** | `instance:node_cpu_utilisation:rate5m` (recording rule) |
| Memory Saturation | **Saturation** | `instance:node_memory_usage_percent:ratio` (recording rule) |

### Dashboard variables

| Variable | Purpose |
|----------|---------|
| `$datasource` | Allows switching between Prometheus instances |
| `$instance` | Filters all panels by Node Exporter instance (multi-select) |

---

## Step 3 – Alerting Rules & Alertmanager

### Alert rules (`prometheus/alert_rules.yml`)

All alerts reference recording rules where applicable so evaluation is fast.

| Alert | Severity | Condition | For |
|-------|----------|-----------|-----|
| `HighCpuUsageWarning` | warning | CPU > 75% | 2m |
| `HighCpuUsageCritical` | critical | CPU > 90% | 1m |
| `HighMemoryUsageWarning` | warning | Memory > 80% | 2m |
| `HighMemoryUsageCritical` | critical | Memory > 95% | 1m |
| `DiskSpaceWarning` | warning | Disk used > 80% | 5m |
| `DiskSpaceCritical` | critical | Disk used > 95% | 1m |
| `NetworkReceiveErrorsWarning` | warning | rx errors > 10/s | 2m |
| `NetworkReceiveErrorsCritical` | critical | rx errors > 100/s | 1m |
| `InstanceDown` | critical | `up == 0` | 1m |

### Alertmanager routing (`alertmanager/alertmanager.yml`)

```
route (default)
├── severity=critical  →  critical_receiver  (group_wait 10s, repeat 1h)
└── severity=warning   →  warning_receiver   (group_wait 30s, repeat 4h)
```

An **inhibition rule** suppresses `warning` alerts when a matching `critical` alert is already firing for the same `alertname` + `instance`.

To view active alerts: **http://localhost:9093**

---

## Step 4 – Recording Rules & Optimization

### Why recording rules?

Prometheus evaluates PromQL on every scrape. Complex aggregations (e.g., summing CPU across all cores) performed repeatedly waste CPU. Recording rules **pre-compute** these aggregations and store results as new time series, so dashboards and alert rules read a single, already-calculated metric instead of repeating the calculation.

### Defined recording rules (`prometheus/recording_rules.yml`)

| Rule name | Formula | Used in |
|-----------|---------|---------|
| `instance:node_memory_usage_percent:ratio` | `(MemTotal - MemAvailable) / MemTotal` | Memory saturation panel + `HighMemoryUsage*` alerts |
| `instance:node_cpu_utilisation:rate5m` | `1 - avg(rate(idle[5m]))` | CPU saturation panel |
| `instance:node_disk_read_bytes:rate5m` | `sum(rate(node_disk_read_bytes_total[5m]))` | Disk I/O Traffic panel |
| `instance:node_disk_written_bytes:rate5m` | `sum(rate(node_disk_written_bytes_total[5m]))` | Disk I/O Traffic panel |
| `instance:node_network_receive_bytes:rate5m` | `sum(rate(node_network_receive_bytes_total[5m]))` | Network Traffic panel |
| `instance:node_network_transmit_bytes:rate5m` | `sum(rate(node_network_transmit_bytes_total[5m]))` | Network Traffic panel |

The naming convention follows the **Prometheus recording rule naming standard**:  
`<aggregation_level>:<metric_name>:<operation>`

---

## Step 5 – Backup & Disaster Recovery

### Create a Prometheus snapshot

Prometheus exposes an admin API endpoint for snapshots (enabled by `--web.enable-admin-api`):

```bash
curl -XPOST http://localhost:9090/api/v1/admin/tsdb/snapshot
# Response: {"status":"success","data":{"name":"20240404T184900Z-abc123"}}
```

The snapshot is written to:
```
<prometheus_data_volume>/snapshots/20240404T184900Z-abc123/
```

To copy it out of the Docker volume:

```bash
SNAP=$(curl -s -XPOST http://localhost:9090/api/v1/admin/tsdb/snapshot | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['data']['name'])")

docker cp prometheus:/prometheus/snapshots/$SNAP ./prometheus_backup_$SNAP
```

### Restore process

1. Stop the Prometheus container:
   ```bash
   docker compose stop prometheus
   ```
2. Copy the snapshot data into the volume (replace the existing data):
   ```bash
   docker run --rm \
     -v bachelor-projects_prometheus_data:/prometheus \
     -v $(pwd)/prometheus_backup_$SNAP:/backup:ro \
     alpine sh -c "rm -rf /prometheus/* && cp -a /backup/. /prometheus/"
   ```
3. Restart Prometheus:
   ```bash
   docker compose start prometheus
   ```

### Alternative – volume-level backup

For a full backup of the Docker volume (including WAL and metadata):

```bash
docker run --rm \
  -v bachelor-projects_prometheus_data:/data:ro \
  -v $(pwd):/backup \
  alpine tar czf /backup/prometheus_$(date +%Y%m%d).tar.gz -C /data .
```

Restore:
```bash
docker compose stop prometheus
docker run --rm \
  -v bachelor-projects_prometheus_data:/data \
  -v $(pwd):/backup:ro \
  alpine sh -c "rm -rf /data/* && tar xzf /backup/prometheus_<date>.tar.gz -C /data"
docker compose start prometheus
```

---

## Architecture Overview

```
Host machine
│
├─ node_exporter:9100  ──scrape──►  Prometheus:9090
├─ alertmanager:9093   ──scrape──►  Prometheus:9090
└─ prometheus:9090     ──scrape──►  Prometheus:9090 (self)

Prometheus:9090  ──evaluate rules──►  alert_rules.yml
                                           │
                                           ▼
                                   Alertmanager:9093
                                           │
                              ┌────────────┴────────────┐
                              ▼                         ▼
                     critical_receiver          warning_receiver

Grafana:3000  ──query──►  Prometheus:9090
```

## Key PromQL Concepts

| Concept | Explanation |
|---------|-------------|
| `rate(metric[5m])` | Per-second average rate of a counter over 5 minutes |
| `avg by(instance)` | Aggregate across all CPU cores, keep `instance` label |
| `1 - idle` | Invert idle fraction to get utilisation |
| `node_memory_MemAvailable_bytes` | Kernel-reported available memory (includes reclaimable caches) |
| `label_values()` | Grafana function to populate template variables from metric labels |
| Recording rule naming `a:b:c` | `a`=aggregation level, `b`=metric, `c`=operation |
