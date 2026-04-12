const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const client = require("prom-client");

// ── Prometheus setup ────────────────────────────────────────────────────────
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

// ── Configuration ───────────────────────────────────────────────────────────
const mongoURI =
  process.env.MONGO_URI ||
  "mongodb://admin:admin123@localhost:27017/analytical_platform?authSource=admin";
const PORT = process.env.PORT || 3000;

// ── Express app ─────────────────────────────────────────────────────────────
const app = express();

app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP metrics middleware (must be before routes)
app.use((req, res, next) => {
  const endTimer = httpRequestDuration.startTimer();
  res.on("finish", () => {
    const route =
      req.route
        ? req.baseUrl + req.route.path
        : req.path.replace(/\/[0-9a-f]{24}/gi, "/:id");
    const labels = {
      method: req.method,
      route: route || "/",
      status_code: String(res.statusCode),
    };
    httpRequestsTotal.inc(labels);
    endTimer(labels);
  });
  next();
});

// Static frontend files
app.use(express.static(path.join(__dirname, "public")));

// ── Import routes ────────────────────────────────────────────────────────────
const measurementsRouter = require("./routes/measurements");

// ── MongoDB connection ───────────────────────────────────────────────────────
mongoose
  .connect(mongoURI)
  .then(() => {
    console.log("✓ Successfully connected to MongoDB");
  })
  .catch((error) => {
    console.error("✗ MongoDB connection error:", error.message);
    process.exit(1);
  });

mongoose.connection.on("error", (error) => {
  console.error("MongoDB connection error:", error);
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

// ── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/measurements", measurementsRouter);

app.get("/api", (req, res) => {
  res.json({
    message: "Analytical Platform API",
    version: "1.0.0",
    endpoints: {
      measurements:
        "/api/measurements?field={field}&start_date={YYYY-MM-DD}&end_date={YYYY-MM-DD}",
      metrics:
        "/api/measurements/metrics?field={field}&start_date={YYYY-MM-DD}&end_date={YYYY-MM-DD}",
      allFields:
        "/api/measurements/all-fields?start_date={YYYY-MM-DD}&end_date={YYYY-MM-DD}",
      dateRange: "/api/measurements/date-range",
    },
    availableFields: ["field1", "field2", "field3"],
  });
});

app.get("/api/health", (req, res) => {
  const health = {
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  };
  res.json(health);
});

// Prometheus metrics endpoint
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

// 404 handler for API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Error:", error);
  res.status(error.status || 500).json({
    error: error.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
});

// ── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🔌 API:       http://localhost:${PORT}/api`);
  console.log(`📈 Metrics:   http://localhost:${PORT}/metrics`);
  console.log(`========================================\n`);
});

process.on("SIGINT", async () => {
  console.log("\nShutting down gracefully...");
  await mongoose.connection.close();
  console.log("MongoDB connection closed");
  process.exit(0);
});

module.exports = app;
