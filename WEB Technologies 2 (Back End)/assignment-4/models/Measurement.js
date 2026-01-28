const mongoose = require("mongoose");

// Define the schema for measurements
const measurementSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      required: true,
      // Removed "index: true" - индекс создается ниже
    },
    field1: {
      type: Number,
      required: true,
    },
    field2: {
      type: Number,
      required: true,
    },
    field3: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: false,
    collection: "measurements",
  },
);

// Create indexes for better query performance
measurementSchema.index({ timestamp: 1 });
measurementSchema.index({ timestamp: 1, field1: 1 });
measurementSchema.index({ timestamp: 1, field2: 1 });
measurementSchema.index({ timestamp: 1, field3: 1 });

// Create and export the model
const Measurement = mongoose.model("Measurement", measurementSchema);

module.exports = Measurement;
