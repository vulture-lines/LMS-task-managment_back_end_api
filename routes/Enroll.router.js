const express = require("express");
const router = express.Router();
const User = require("../models/User.model");
const Course = require("../models/Course.model");
const authenticate = require("../middleware/auth");

const requireMentor = (req, res, next) => {
  if (req.user.role !== "Mentor") {
    return res.status(403).json({ error: "Only mentors can modify enrollments" });
  }
  next();
};

// Enroll a user in a course
router.post("/:userId/:courseId", authenticate, requireMentor, async (req, res) => {
  try {
    const { userId, courseId } = req.params;

    const user = await User.findById(userId);
    const course = await Course.findById(courseId);
    if (!user || !course) return res.status(404).json({ error: "User or course not found" });

    const alreadyEnrolled = user.enrolledCourses.some(e => e.courseId.toString() === courseId);
    if (alreadyEnrolled) {
      return res.status(400).json({ error: "User already enrolled in this course" });
    }

    user.enrolledCourses.push({ courseId });
    await user.save();

    res.json({ message: "User enrolled successfully", enrolledCourses: user.enrolledCourses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User self-enrolls 
router.post("/:courseId", authenticate, async (req, res) => {
    try {
      const { courseId } = req.params;
      const user = await User.findById(req.user._id);
      const course = await Course.findById(courseId);
  
      if (!user || !course) return res.status(404).json({ error: "User or course not found" });
  
      const alreadyEnrolled = user.enrolledCourses.some(e => e.courseId.toString() === courseId);
      if (alreadyEnrolled) {
        return res.status(400).json({ error: "You are already enrolled in this course" });
      }
  
      user.enrolledCourses.push({ courseId, enrolledAt: new Date() });
      await user.save();
  
      res.status(201).json({ message: "Enrolled successfully", enrolledCourses: user.enrolledCourses });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  

router.get("/:userId", authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate("enrolledCourses.courseId", "title thumbnail");

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ enrolledCourses: user.enrolledCourses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.put("/:userId/:courseId", authenticate, requireMentor, async (req, res) => {
  try {
    const { userId, courseId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const course = user.enrolledCourses.find(e => e.courseId.toString() === courseId);
    if (!course) return res.status(404).json({ error: "Enrollment not found" });

    course.enrolledAt = new Date();
    await user.save();

    res.json({ message: "Enrollment timestamp updated", enrolledCourses: user.enrolledCourses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.delete("/:userId/:courseId", authenticate, requireMentor, async (req, res) => {
  try {
    const { userId, courseId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.enrolledCourses = user.enrolledCourses.filter(
      e => e.courseId.toString() !== courseId
    );

    await user.save();
    res.json({ message: "Enrollment removed", enrolledCourses: user.enrolledCourses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
