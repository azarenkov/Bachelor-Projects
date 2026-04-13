module.exports = {
  secret: process.env.JWT_SECRET || "your-secret-key",
  jwtExpiration: process.env.JWT_EXPIRE || "7d",
};
