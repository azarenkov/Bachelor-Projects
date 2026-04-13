const SavedJob = require("../models/savedJob.model");
const Job = require("../models/job.model");

exports.create = async (req, res) => {
  try {
    const job = await Job.findById(req.body.job);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const existingSaved = await SavedJob.findOne({
      user: req.userId,
      job: req.body.job,
    });

    if (existingSaved) {
      return res.status(400).json({ message: "Job already saved" });
    }

    const savedJob = new SavedJob({
      user: req.userId,
      job: req.body.job,
    });

    await savedJob.save();
    res.status(201).json({ message: "Job saved successfully", savedJob });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.findAll = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const savedJobs = await SavedJob.find({ user: req.userId })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate({
        path: "job",
        populate: { path: "company", select: "name location logo" },
      })
      .sort({ savedAt: -1 })
      .exec();

    const count = await SavedJob.countDocuments({ user: req.userId });

    res.json({
      savedJobs,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const savedJob = await SavedJob.findOne({
      user: req.userId,
      job: req.params.jobId,
    });

    if (!savedJob) {
      return res.status(404).json({ message: "Saved job not found" });
    }

    await SavedJob.findByIdAndDelete(savedJob._id);
    res.json({ message: "Saved job removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
