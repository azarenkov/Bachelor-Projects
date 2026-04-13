const Job = require("../models/job.model");
const Company = require("../models/company.model");

exports.create = async (req, res) => {
  try {
    const company = await Company.findById(req.body.company);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    if (
      company.userId.toString() !== req.userId &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const job = new Job({
      ...req.body,
      postedBy: req.userId,
    });

    await job.save();
    res.status(201).json({ message: "Job created successfully", job });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.findAll = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      location,
      type,
      status = "active",
      skills,
      salaryMin,
      salaryMax,
    } = req.query;

    const query = { status };

    if (search) {
      query.$text = { $search: search };
    }
    if (location) {
      query.location = new RegExp(location, "i");
    }
    if (type) {
      query.type = type;
    }
    if (skills) {
      query.skills = { $in: skills.split(",") };
    }
    if (salaryMin || salaryMax) {
      query["salary.min"] = {};
      if (salaryMin) query["salary.min"].$gte = Number(salaryMin);
      if (salaryMax) query["salary.max"] = { $lte: Number(salaryMax) };
    }

    const jobs = await Job.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("company", "name location logo")
      .populate("postedBy", "username email")
      .sort({ createdAt: -1 })
      .exec();

    const count = await Job.countDocuments(query);

    res.json({
      jobs,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.findOne = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate("company")
      .populate("postedBy", "username email");

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.postedBy.toString() !== req.userId && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const updatedJob = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ message: "Job updated successfully", job: updatedJob });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.postedBy.toString() !== req.userId && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: "Job deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.findByCompany = async (req, res) => {
  try {
    const jobs = await Job.find({
      company: req.params.companyId,
      status: "active",
    })
      .populate("company", "name location logo")
      .populate("postedBy", "username email")
      .sort({ createdAt: -1 });

    res.json({ jobs, total: jobs.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
