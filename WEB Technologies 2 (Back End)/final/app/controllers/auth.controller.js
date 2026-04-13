const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const authConfig = require("../config/auth.config");

exports.register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      password: hashedPassword,
      role: role || "jobseeker",
    });

    await user.save();

    const token = jwt.sign({ id: user._id }, authConfig.secret, {
      expiresIn: authConfig.jwtExpiration,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: user.toJSON(),
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, authConfig.secret, {
      expiresIn: authConfig.jwtExpiration,
    });

    res.json({
      message: "Login successful",
      user: user.toJSON(),
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
