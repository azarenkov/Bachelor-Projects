const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    location: String,
    type: {
      type: String,
      enum: ["full-time", "part-time", "contract", "internship", "remote"],
      default: "full-time",
    },
    salary: {
      min: Number,
      max: Number,
      currency: {
        type: String,
        default: "USD",
      },
    },
    requirements: [String],
    responsibilities: [String],
    skills: [String],
    status: {
      type: String,
      enum: ["active", "closed", "draft"],
      default: "active",
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    applicationsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

jobSchema.index({ company: 1 });
jobSchema.index({ postedBy: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ title: "text", description: "text" });
jobSchema.index({ skills: 1 });
jobSchema.index({ location: 1 });
jobSchema.index({ type: 1 });

jobSchema.virtual("applications", {
  ref: "Application",
  localField: "_id",
  foreignField: "job",
});

jobSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Job", jobSchema);
