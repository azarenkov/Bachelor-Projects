const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./app/config/db.config");

dotenv.config();

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Job Finding Platform API",
    version: "1.0.0",
  });
});

require("./app/routes/auth.routes")(app);
require("./app/routes/user.routes")(app);
require("./app/routes/company.routes")(app);
require("./app/routes/job.routes")(app);
require("./app/routes/application.routes")(app);
require("./app/routes/saved.routes")(app);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
