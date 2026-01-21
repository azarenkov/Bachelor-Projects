const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const {
  createBlog,
  getAllBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  getBlogStats,
} = require("../controllers/blogController");

const blogValidation = [
  body("title")
    .notEmpty()
    .withMessage("Title is required")
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("Title must be between 3 and 200 characters"),
  body("body")
    .notEmpty()
    .withMessage("Body is required")
    .trim()
    .isLength({ min: 10 })
    .withMessage("Body must be at least 10 characters long"),
  body("author")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Author name cannot exceed 100 characters"),
];

router.get("/stats", getBlogStats);

router.post("/", blogValidation, createBlog);

router.get("/", getAllBlogs);

router.get("/:id", getBlogById);

router.put("/:id", blogValidation, updateBlog);

router.delete("/:id", deleteBlog);

module.exports = router;
