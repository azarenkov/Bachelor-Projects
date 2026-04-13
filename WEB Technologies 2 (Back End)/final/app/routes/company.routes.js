const controller = require("../controllers/company.controller");
const { verifyToken, isEmployer } = require("../middlewares/auth.middleware");
const {
  companyValidation,
  idValidation,
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
    "/api/companies",
    verifyToken,
    isEmployer,
    companyValidation,
    controller.create,
  );

  app.get("/api/companies", controller.findAll);

  app.get("/api/companies/:id", idValidation, controller.findOne);

  app.put(
    "/api/companies/:id",
    verifyToken,
    isEmployer,
    idValidation,
    companyValidation,
    controller.update,
  );

  app.delete(
    "/api/companies/:id",
    verifyToken,
    isEmployer,
    idValidation,
    controller.delete,
  );
};
