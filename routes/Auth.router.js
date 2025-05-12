
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/User.model");
const authenticate = require("../middleware/auth");
const sendWelcomeEmail = require("../middleware/mailer"); 
const router = express.Router();

let resetTokens = {}

// Password validation 
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,30}$/;

// Manual signup 
router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      password: "Password must be 6-30 characters long, include at least one uppercase letter, one lowercase letter, one number, and one special character."
    });
  }

  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    return res.status(409).json({ error: "Email or username already in use" });
  }

  const salt = await bcrypt.genSalt(12); 
  const hashedPassword = await bcrypt.hash(password, salt);
  const user = new User({
    username,
    email,
    password: hashedPassword,
    isApproved: false,
    role: "Student"
  });

  await user.save();
  await sendWelcomeEmail(email, username);

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
  user.token = token;
  await user.save();

  res.status(201).json({ token, user });
});

// Manual login
router.post("/login", async (req, res) => {
  const { identifier, password } = req.body; // identifier = email or username

  if (!identifier || !password) {
    return res.status(400).json({ error: "Email/Username and password are required" });
  }

  const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });
  if (!user || !user.password) {
    return res.status(401).json({ error: "Invalid Email or Username" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ error: "Invalid Password" });
  }

  if (!user.isApproved) {
    return res.status(403).json({ error: "Account not approved by admin" });
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
  user.token = token;
  await user.save();

  res.json({ token, user });
});


// Google sign-in/sign-up
router.post("/google", async (req, res) => {
  const { email, socialId } = req.body;

  if (!email || !socialId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  let user = await User.findOne({ email });

  if (!user) {
    let baseUsername = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
    let uniqueUsername = baseUsername;
    let count = 1;

    while (await User.findOne({ username: uniqueUsername })) {
      uniqueUsername = `${baseUsername}${count}`;
      count++;
    }

    user = new User({
      email,
      socialId,
      username: uniqueUsername,
      isApproved: false,
      role: "Student"
    });

    await user.save();
    await sendWelcomeEmail(email, uniqueUsername);

    return res.status(201).json({
      message: "Registered successfully. Waiting for approval.",
      user
    });
  }
  if (user.socialId !== socialId) {
    return res.status(401).json({ error: "Invalid social ID" });
  }

  if (!user.isApproved) {
    return res.status(403).json({ error: "Account not approved yet." });
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d"
  });
  user.token = token;
  await user.save();

  res.json({ message: "Login successful", token, user });
});

// Forgot password
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: "User not found" });

  const token = crypto.randomBytes(32).toString("hex");
  resetTokens[token] = user._id;

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

  await transporter.sendMail({
    to: email,
    subject: "Password Reset",
    html: `<p>Click here to reset password: <a href="${resetLink}">${resetLink}</a></p>`
  });

  res.json({ message: "Password reset email sent" });
});

// Reset password
router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({
      error: "Password must be 6-30 characters long, include at least one uppercase letter, one lowercase letter, one number, and one special character."
    });
  }

  const userId = resetTokens[token];
  if (!userId) return res.status(400).json({ error: "Invalid or expired token" });

  const salt = await bcrypt.genSalt(12);
  const hashed = await bcrypt.hash(newPassword, salt);
  await User.findByIdAndUpdate(userId, { password: hashed });

  delete resetTokens[token];
  res.json({ message: "Password updated successfully" });
});

// Logout
router.post("/logout", authenticate, async (req, res) => {
  req.user.token = null;
  await req.user.save();
  res.json({ message: "Logged out successfully" });
});

module.exports = router;
