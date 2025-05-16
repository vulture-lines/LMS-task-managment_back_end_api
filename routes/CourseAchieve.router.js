const express = require("express");
const router = express.Router();
const CourseAchievement = require("../models/CourseAchievement.model");
const Course = require("../models/Course.model");
const User = require("../models/User.model");
const authenticate = require("../middleware/auth");

const requireMentor = (req, res, next) => {
  if (req.user.role !== "Mentor") {
    return res.status(403).json({ error: "Only mentors/admins can perform this action" });
  }
  next();
};


router.get("/", authenticate, requireMentor, async (req, res) => {
    try {
      const data = await CourseAchievement.find().sort({ createdAt: -1 });
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
router.get("/:userId", authenticate, async (req, res) => {
  try {
    const data = await CourseAchievement.find({ user: req.params.userId });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post("/", authenticate, requireMentor, async (req, res) => {
  try {
    const { userId, courseId, certificateUrl } = req.body;

    const user = await User.findById(userId);
    const course = await Course.findById(courseId);
    if (!user || !course) return res.status(404).json({ error: "User or course not found" });

    const exists = await CourseAchievement.findOne({ user: userId, courseId });
    if (exists) return res.status(409).json({ error: "Achievement already exists" });

    const achievement = await CourseAchievement.create({
      user: userId,
      username: user.username,
      courseId,
      courseTitle: course.title,
      certificateUrl
    });

    res.status(201).json({ message: "Course achievement created", achievement });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


router.put("/:id", authenticate, requireMentor, async (req, res) => {
  try {
    const { userId, courseId, certificateUrl } = req.body;

    const user = await User.findById(userId);
    const course = await Course.findById(courseId);
    if (!user || !course) {
      return res.status(404).json({ error: "User or course not found" });
    }

    const updated = await CourseAchievement.findByIdAndUpdate(
      req.params.id,
      {
        user: userId,
        username: user.username,
        courseId,
        courseTitle: course.title,
        certificateUrl,
        completedAt: new Date() // Optional: refresh timestamp when editing
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Achievement not found" });
    }

    res.json({ message: "Achievement updated", updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/edit/:id", authenticate, requireMentor, async (req, res) => {
  try {
    const { certificateUrl } = req.body;

    const updated = await CourseAchievement.findByIdAndUpdate(
      req.params.id,
      { certificateUrl },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "Achievement not found" });
    res.json({ message: "Achievement updated", updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


router.delete("/:id", authenticate, requireMentor, async (req, res) => {
  try {
    const result = await CourseAchievement.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: "Achievement not found" });
    res.json({ message: "Achievement deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
