require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/database");
const blogRoutes = require("./routes/blogRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
  });
}

app.use("/api/blogs", blogRoutes);

app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Blog CRUD API",
    version: "1.0.0",
    endpoints: {
      "GET /api/blogs": "Get all blog posts",
      "GET /api/blogs/:id": "Get single blog post",
      "POST /api/blogs": "Create new blog post",
      "PUT /api/blogs/:id": "Update blog post",
      "DELETE /api/blogs/:id": "Delete blog post",
      "GET /api/blogs/stats": "Get blog statistics",
    },
  });
});

app.use("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n Server is running on port ${PORT}`);
  console.log(`Frontend: http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
  console.log(`MongoDB UI: http://localhost:8081`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}\n`);
});

process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Promise Rejection:", err);
  process.exit(1);
});
