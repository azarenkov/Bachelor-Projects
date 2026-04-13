const { body, param, query, validationResult } = require("express-validator");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const registerValidation = [
  body("username")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters"),
  body("email").isEmail().normalizeEmail().withMessage("Invalid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("role")
    .optional()
    .isIn(["jobseeker", "employer", "admin"])
    .withMessage("Invalid role"),
  validate,
];

const loginValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Invalid email"),
  body("password").notEmpty().withMessage("Password is required"),
  validate,
];

const updateUserValidation = [
  body("username").optional().trim().isLength({ min: 3 }),
  body("email").optional().isEmail().normalizeEmail(),
  body("firstName").optional().trim(),
  body("lastName").optional().trim(),
  body("phone").optional().trim(),
  body("location").optional().trim(),
  validate,
];

const companyValidation = [
  body("name").trim().notEmpty().withMessage("Company name is required"),
  body("description").optional().trim(),
  body("website").optional().isURL(),
  body("industry").optional().trim(),
  body("size")
    .optional()
    .isIn(["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"]),
  body("location").optional().trim(),
  validate,
];

const jobValidation = [
  body("title").trim().notEmpty().withMessage("Job title is required"),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Job description is required"),
  body("company").isMongoId().withMessage("Valid company ID is required"),
  body("location").optional().trim(),
  body("type")
    .optional()
    .isIn(["full-time", "part-time", "contract", "internship", "remote"]),
  body("salary.min").optional().isNumeric(),
  body("salary.max").optional().isNumeric(),
  body("salary.currency").optional().trim(),
  body("requirements").optional().isArray(),
  body("responsibilities").optional().isArray(),
  body("skills").optional().isArray(),
  body("status").optional().isIn(["active", "closed", "draft"]),
  validate,
];

const applicationValidation = [
  body("job").isMongoId().withMessage("Valid job ID is required"),
  body("coverLetter").optional().trim().isLength({ max: 2000 }),
  body("resumeUrl").optional().trim(),
  validate,
];

const idValidation = [param("id").isMongoId().withMessage("Invalid ID"), validate];

const jobIdValidation = [param("jobId").isMongoId().withMessage("Invalid Job ID"), validate];

const companyIdValidation = [param("companyId").isMongoId().withMessage("Invalid Company ID"), validate];

const jobQueryValidation = [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("type")
    .optional()
    .isIn(["full-time", "part-time", "contract", "internship", "remote"]),
  query("status").optional().isIn(["active", "closed", "draft"]),
  validate,
];

const applicationStatusValidation = [
  body("status")
    .isIn(["pending", "reviewed", "accepted", "rejected"])
    .withMessage("Invalid status"),
  validate,
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  updateUserValidation,
  companyValidation,
  jobValidation,
  applicationValidation,
  idValidation,
  jobIdValidation,
  companyIdValidation,
  jobQueryValidation,
  applicationStatusValidation,
};
