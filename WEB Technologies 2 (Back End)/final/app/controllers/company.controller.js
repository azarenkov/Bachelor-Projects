const Company = require("../models/company.model");

exports.create = async (req, res) => {
  try {
    const company = new Company({
      ...req.body,
      userId: req.userId,
    });

    await company.save();
    res.status(201).json({ message: "Company created successfully", company });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.findAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, industry } = req.query;

    const query = {};
    if (search) {
      query.$text = { $search: search };
    }
    if (industry) {
      query.industry = industry;
    }

    const companies = await Company.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("userId", "username email")
      .exec();

    const count = await Company.countDocuments(query);

    res.json({
      companies,
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
    const company = await Company.findById(req.params.id).populate(
      "userId",
      "username email",
    );

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.json(company);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    if (
      company.userId.toString() !== req.userId &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const updatedCompany = await Company.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );

    res.json({
      message: "Company updated successfully",
      company: updatedCompany,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    if (
      company.userId.toString() !== req.userId &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    await Company.findByIdAndDelete(req.params.id);
    res.json({ message: "Company deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
