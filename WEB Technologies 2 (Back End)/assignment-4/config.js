// Configuration file for the analytical platform
require("dotenv").config();

module.exports = {
  // MongoDB connection string with authentication
  // Use 'localhost' when running app locally with Docker Compose
  mongoURI:
    process.env.MONGO_URI ||
    "mongodb://admin:admin123@localhost:27017/analytical_platform?authSource=admin",

  // Server port
  port: process.env.PORT || 3000,

  // Database name
  dbName: "analytical_platform",

  // Collection name
  collectionName: "measurements",

  // CORS settings
  corsOptions: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },
};
