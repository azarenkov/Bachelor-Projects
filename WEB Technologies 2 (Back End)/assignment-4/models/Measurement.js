const mongoose = require("mongoose");

const measurementSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      required: true,
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

measurementSchema.index({ timestamp: 1 });
measurementSchema.index({ timestamp: 1, field1: 1 });
measurementSchema.index({ timestamp: 1, field2: 1 });
measurementSchema.index({ timestamp: 1, field3: 1 });

const Measurement = mongoose.model("Measurement", measurementSchema);

module.exports = Measurement;
