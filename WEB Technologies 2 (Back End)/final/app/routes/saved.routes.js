const controller = require("../controllers/saved.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const {
  idValidation,
  applicationValidation,
} = require("../middlewares/validation.middleware");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept",
    );
    next();
  });

  app.post(
    "/api/saved",
    verifyToken,
    applicationValidation,
    controller.create,
  );

  app.get("/api/saved", verifyToken, controller.findAll);

  app.delete("/api/saved/:jobId", verifyToken, idValidation, controller.delete);
};
