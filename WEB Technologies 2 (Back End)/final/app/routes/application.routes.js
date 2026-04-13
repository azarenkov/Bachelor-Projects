const controller = require("../controllers/application.controller");
const { verifyToken, isEmployer } = require("../middlewares/auth.middleware");
const {
  applicationValidation,
  idValidation,
  jobIdValidation,
  applicationStatusValidation,
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
    "/api/applications",
    verifyToken,
    applicationValidation,
    controller.create,
  );

  app.get("/api/applications", verifyToken, controller.findAll);

  // This route MUST come before /api/applications/:id to avoid conflicts
  app.get(
    "/api/applications/job/:jobId",
    verifyToken,
    isEmployer,
    jobIdValidation,
    controller.findByJob,
  );

  app.get("/api/applications/:id", verifyToken, idValidation, controller.findOne);

  app.put(
    "/api/applications/:id",
    verifyToken,
    isEmployer,
    idValidation,
    applicationStatusValidation,
    controller.update,
  );

  app.delete(
    "/api/applications/:id",
    verifyToken,
    idValidation,
    controller.delete,
  );
};
