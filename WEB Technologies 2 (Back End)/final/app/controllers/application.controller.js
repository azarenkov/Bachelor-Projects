const Application = require("../models/application.model");
const Job = require("../models/job.model");

exports.create = async (req, res) => {
  try {
    console.log('=== Create Application ===');
    console.log('Request body:', req.body);
    console.log('User ID:', req.userId);
    
    const job = await Job.findById(req.body.job);
    console.log('Found job:', job ? job._id : 'NOT FOUND');
    
    if (!job) {
      console.log('Job not found');
      return res.status(404).json({ message: "Job not found" });
    }

    console.log('Job status:', job.status);
    if (job.status !== "active") {
      console.log('Job is not active');
      return res.status(400).json({ message: "Job is not active" });
    }

    const existingApplication = await Application.findOne({
      job: req.body.job,
      applicant: req.userId,
    });
    console.log('Existing application:', existingApplication ? 'YES' : 'NO');

    if (existingApplication) {
      console.log('Already applied to this job');
      return res.status(400).json({ message: "Already applied to this job" });
    }

    const application = new Application({
      ...req.body,
      applicant: req.userId,
    });
    
    console.log('Creating application:', application);
    await application.save();
    console.log('Application saved successfully');
    
    res
      .status(201)
      .json({ message: "Application submitted successfully", application });
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.findAll = async (req, res) => {
  try {
    console.log('=== findAll applications ===');
    console.log('User ID:', req.userId);
    console.log('Query params:', req.query);
    
    const { page = 1, limit = 10, status } = req.query;

    const query = { applicant: req.userId };
    if (status) {
      query.status = status;
    }

    console.log('MongoDB query:', query);

    const applications = await Application.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("job")
      .populate({
        path: "job",
        populate: { path: "company", select: "name location logo" },
      })
      .sort({ appliedAt: -1 })
      .exec();

    const count = await Application.countDocuments(query);

    console.log('Found applications count:', count);
    console.log('Applications:', applications.length);

    res.json({
      applications,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    console.error('Error in findAll applications:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.findOne = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate("job")
      .populate("applicant", "-password")
      .populate({
        path: "job",
        populate: { path: "company" },
      });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id).populate(
      "job",
    );

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (
      application.job.postedBy.toString() !== req.userId &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const updatedApplication = await Application.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true },
    );

    res.json({
      message: "Application updated successfully",
      application: updatedApplication,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.applicant.toString() !== req.userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    await Application.findByIdAndDelete(req.params.id);
    res.json({ message: "Application withdrawn successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.findByJob = async (req, res) => {
  try {
    console.log('=== findByJob called ===');
    console.log('jobId:', req.params.jobId);
    console.log('userId:', req.userId);
    console.log('user role:', req.user?.role);
    
    const job = await Job.findById(req.params.jobId);
    console.log('Found job:', job ? job._id : 'NOT FOUND');

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    console.log('job.postedBy:', job.postedBy);
    console.log('Comparing:', job.postedBy.toString(), 'vs', req.userId);
    
    if (job.postedBy.toString() !== req.userId && req.user.role !== "admin") {
      console.log('Access denied! postedBy does not match userId');
      return res.status(403).json({ message: "Access denied" });
    }

    const applications = await Application.find({ job: req.params.jobId })
      .populate("applicant", "-password")
      .sort({ appliedAt: -1 });

    console.log('Found applications:', applications.length);
    res.json({ applications, total: applications.length });
  } catch (error) {
    console.error('Error in findByJob:', error);
    res.status(500).json({ message: error.message });
  }
};
