'use strict';

const express = require('express');
const client = require('prom-client');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Prometheus registry ──────────────────────────────────────────────────────
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Counter: total HTTP requests
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Histogram: request duration (latency)
const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

// ── Middleware: instrument every request ─────────────────────────────────────
app.use((req, res, next) => {
  const end = httpRequestDurationSeconds.startTimer();
  res.on('finish', () => {
    const labels = {
      method: req.method,
      route: req.route ? req.route.path : req.path,
      status_code: res.statusCode,
    };
    httpRequestsTotal.inc(labels);
    end(labels);
  });
  next();
});

// ── Routes ───────────────────────────────────────────────────────────────────

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'monitoring-api' });
});

// Normal endpoint – always succeeds
app.get('/api/items', (req, res) => {
  const items = [
    { id: 1, name: 'Widget A' },
    { id: 2, name: 'Widget B' },
    { id: 3, name: 'Widget C' },
  ];
  res.json({ items });
});

// Flaky endpoint – fails ~15% of the time (to generate error-rate signal)
app.get('/api/orders', (req, res) => {
  if (Math.random() < 0.15) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
  res.json({ orders: [{ id: 'ORD-001', total: 99.99 }] });
});

// Slow endpoint – introduces artificial latency (to generate latency signal)
app.get('/api/reports', (req, res) => {
  const delayMs = Math.floor(Math.random() * 800) + 200; // 200–1000 ms
  setTimeout(() => {
    res.json({ report: 'Monthly summary', generatedIn: `${delayMs}ms` });
  }, delayMs);
});

// Prometheus metrics scrape endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
  console.log(`Metrics available at http://localhost:${PORT}/metrics`);
});
