const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const config = require("./config");

// Import routes
const measurementsRouter = require("./routes/measurements");

// Initialize Express app
const app = express();

// Middleware
app.use(cors(config.corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "public")));

// MongoDB connection
mongoose
  .connect(config.mongoURI)
  .then(() => {
    console.log("✓ Successfully connected to MongoDB");
    console.log(`✓ Database: ${config.dbName}`);
    console.log(`✓ Collection: ${config.collectionName}`);
  })
  .catch((error) => {
    console.error("✗ MongoDB connection error:", error.message);
    process.exit(1);
  });

// Handle MongoDB connection events
mongoose.connection.on("error", (error) => {
  console.error("MongoDB connection error:", error);
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

// API Routes
app.use("/api/measurements", measurementsRouter);

// Root endpoint
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

// Health check endpoint
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

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🔌 API: http://localhost:${PORT}/api`);
  console.log(`========================================\n`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nShutting down gracefully...");
  await mongoose.connection.close();
  console.log("MongoDB connection closed");
  process.exit(0);
});

module.exports = app;
