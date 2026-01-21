const Blog = require("../models/Blog");
const { validationResult } = require("express-validator");

exports.createBlog = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { title, body, author } = req.body;

    const blog = await Blog.create({
      title,
      body,
      author: author || "Anonymous",
    });

    res.status(201).json({
      success: true,
      message: "Blog post created successfully",
      data: blog,
    });
  } catch (error) {
    console.error("Error creating blog post:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: messages,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while creating blog post",
      error: error.message,
    });
  }
};

exports.getAllBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = "-createdAt", search } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { body: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
      ];
    }

    const blogs = await Blog.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Blog.countDocuments(query);

    res.status(200).json({
      success: true,
      count: blogs.length,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: blogs,
    });
  } catch (error) {
    console.error("Error retrieving blog posts:", error);
    res.status(500).json({
      success: false,
      message: "Server error while retrieving blog posts",
      error: error.message,
    });
  }
};

exports.getBlogById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog post ID format",
      });
    }

    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog post not found",
      });
    }

    res.status(200).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    console.error("Error retrieving blog post:", error);
    res.status(500).json({
      success: false,
      message: "Server error while retrieving blog post",
      error: error.message,
    });
  }
};

exports.updateBlog = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const { title, body, author } = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog post ID format",
      });
    }

    const blog = await Blog.findByIdAndUpdate(
      id,
      { title, body, author },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog post not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Blog post updated successfully",
      data: blog,
    });
  } catch (error) {
    console.error("Error updating blog post:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: messages,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while updating blog post",
      error: error.message,
    });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog post ID format",
      });
    }

    const blog = await Blog.findByIdAndDelete(id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog post not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Blog post deleted successfully",
      data: blog,
    });
  } catch (error) {
    console.error("Error deleting blog post:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting blog post",
      error: error.message,
    });
  }
};

exports.getBlogStats = async (req, res) => {
  try {
    const totalBlogs = await Blog.countDocuments();
    const blogsByAuthor = await Blog.aggregate([
      {
        $group: {
          _id: "$author",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalBlogs,
        blogsByAuthor,
      },
    });
  } catch (error) {
    console.error("Error retrieving blog statistics:", error);
    res.status(500).json({
      success: false,
      message: "Server error while retrieving statistics",
      error: error.message,
    });
  }
};
