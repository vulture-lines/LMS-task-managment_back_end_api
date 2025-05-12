const express = require("express");
const router = express.Router();
const Course = require("../models/Course.model");
const User = require("../models/User.model");
const authenticate = require("../middleware/auth");

//  Mentor-only
const requireMentor = (req, res, next) => {
  if (req.user.role !== "Mentor") {
    return res.status(403).json({ error: "Only mentors can perform this action" });
  }
  next();
};

// only file or test allowed
const validateLessons = (lessons) => {
  for (const lesson of lessons) {
    for (const sub of lesson.sublessons || []) {
      if (sub.file && sub.test?.questions?.length > 0) {
        return `Sublesson "${sub.title}" cannot contain both file and test`;
      }
    }
  }
  return null;
};

// Create new course
router.post("/", authenticate, requireMentor, async (req, res) => {
  try {
    const { title, description, thumbnail, price, tags, lessons } = req.body;

    const error = validateLessons(lessons || []);
    if (error) return res.status(400).json({ error });

    const mentor = await User.findById(req.user._id).select("username");

    const course = new Course({
      title,
      description,
      thumbnail,
      price,
      mentor: req.user._id,
      mentorName: mentor.username,
      tags,
      lessons
    });

    await course.save();
    res.status(201).json({ message: "Course created", course });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//Get all courses
router.get("/", async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single course
router.get("/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update course(mentor-only)
router.put("/:id", authenticate, requireMentor, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });

    // if (course.mentor.toString() !== req.user._id.toString()) {
    //   return res.status(403).json({ error: "You can only update your own course" });
    // }

    const error = validateLessons(req.body.lessons || []);
    if (error) return res.status(400).json({ error });

    Object.assign(course, req.body); // merge updates
    await course.save();

    res.json({ message: "Course updated", course });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete course (mentor-only)
router.delete("/:id", authenticate, requireMentor, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });

    // if (course.mentor.toString() !== req.user._id.toString()) {
    //   return res.status(403).json({ error: "You can only delete your own course" });
    // }

    await course.deleteOne();
    res.json({ message: "Course deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
