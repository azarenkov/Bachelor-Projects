const controller = require("../controllers/user.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const {
  updateUserValidation,
} = require("../middlewares/validation.middleware");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept",
    );
    next();
  });

  app.get("/api/users/profile", verifyToken, controller.getProfile);

  app.put(
    "/api/users/profile",
    verifyToken,
    updateUserValidation,
    controller.updateProfile,
  );

  app.delete("/api/users/profile", verifyToken, controller.deleteProfile);
};
