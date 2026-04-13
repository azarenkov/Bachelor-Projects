const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    website: String,
    industry: String,
    size: {
      type: String,
      enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"],
    },
    location: String,
    logo: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

companySchema.index({ userId: 1 });
companySchema.index({ name: "text", description: "text" });

companySchema.virtual("jobs", {
  ref: "Job",
  localField: "_id",
  foreignField: "company",
});

companySchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Company", companySchema);
