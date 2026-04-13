const jwt = require("jsonwebtoken");
const authConfig = require("../config/auth.config");
const User = require("../models/user.model");

const verifyToken = async (req, res, next) => {
  let token = req.headers["x-access-token"] || req.headers["authorization"];

  if (!token) {
    return res.status(403).json({ message: "No token provided" });
  }

  if (token.startsWith("Bearer ")) {
    token = token.slice(7, token.length);
  }

  try {
    const decoded = jwt.verify(token, authConfig.secret);
    req.userId = decoded.id;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

const isEmployer = (req, res, next) => {
  if (req.user.role !== "employer" && req.user.role !== "admin") {
    return res.status(403).json({ message: "Require Employer or Admin role" });
  }
  next();
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Require Admin role" });
  }
  next();
};

module.exports = { verifyToken, isEmployer, isAdmin };
