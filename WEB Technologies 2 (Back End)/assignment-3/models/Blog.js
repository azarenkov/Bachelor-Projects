const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters long"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    body: {
      type: String,
      required: [true, "Body is required"],
      trim: true,
      minlength: [10, "Body must be at least 10 characters long"],
    },
    author: {
      type: String,
      trim: true,
      default: "Anonymous",
      maxlength: [100, "Author name cannot exceed 100 characters"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

blogSchema.index({ createdAt: -1 });
blogSchema.index({ title: "text", body: "text" });

blogSchema.virtual("excerpt").get(function () {
  return this.body.length > 100
    ? this.body.substring(0, 100) + "..."
    : this.body;
});

blogSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.id;
    return ret;
  },
});

const Blog = mongoose.model("Blog", blogSchema);

module.exports = Blog;
