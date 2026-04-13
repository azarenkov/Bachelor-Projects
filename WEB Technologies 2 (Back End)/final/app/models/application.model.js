const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "accepted", "rejected"],
      default: "pending",
    },
    coverLetter: {
      type: String,
      maxlength: 2000,
    },
    resumeUrl: String,
    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

applicationSchema.index({ job: 1 });
applicationSchema.index({ applicant: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

applicationSchema.pre("save", async function (next) {
  if (this.isNew) {
    await mongoose
      .model("Job")
      .findByIdAndUpdate(this.job, { $inc: { applicationsCount: 1 } });
  }
  next();
});

module.exports = mongoose.model("Application", applicationSchema);
