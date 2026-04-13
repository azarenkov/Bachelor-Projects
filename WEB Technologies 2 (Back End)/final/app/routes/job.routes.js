const controller = require("../controllers/job.controller");
const { verifyToken, isEmployer } = require("../middlewares/auth.middleware");
const {
  jobValidation,
  idValidation,
  companyIdValidation,
  jobQueryValidation,
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
    "/api/jobs",
    verifyToken,
    isEmployer,
    jobValidation,
    controller.create,
  );

  app.get("/api/jobs", jobQueryValidation, controller.findAll);

  app.get("/api/jobs/:id", idValidation, controller.findOne);

  app.put(
    "/api/jobs/:id",
    verifyToken,
    isEmployer,
    idValidation,
    jobValidation,
    controller.update,
  );

  app.delete(
    "/api/jobs/:id",
    verifyToken,
    isEmployer,
    idValidation,
    controller.delete,
  );

  app.get(
    "/api/jobs/company/:companyId",
    companyIdValidation,
    controller.findByCompany,
  );
};
