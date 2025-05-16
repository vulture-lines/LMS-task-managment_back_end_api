const express = require("express");
const router = express.Router();
const Exam = require("../models/Exam.model");
const Course = require("../models/Course.model");
const authenticate = require("../middleware/auth");

const requireMentor = (req, res, next) => {
  if (req.user.role !== "Mentor") {
    return res.status(403).json({ error: "Only mentors can perform this action" });
  }
  next();
};

router.post("/", authenticate, requireMentor, async (req, res) => {
  try {
    const { title, subject, courseId, duration, questions, tags } = req.body;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const exam = new Exam({
      title,
      subject,
      courseId,
      courseTitle: course.title,
      duration,
      questions,
      createdBy: req.user._id,
      tags
    });

    await exam.save();
    res.status(201).json({ message: "Exam created", exam });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get("/", authenticate, async (req, res) => {
  try {
    const exams = await Exam.find().sort({ createdAt: -1 });
    res.json(exams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get("/:id", authenticate, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ error: "Exam not found" });
    res.json(exam);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", authenticate, requireMentor, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ error: "Exam not found" });

    if (exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized to update this exam" });
    }

    Object.assign(exam, req.body);
    await exam.save();

    res.json({ message: "Exam updated", exam });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete an exam
router.delete("/:id", authenticate, requireMentor, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ error: "Exam not found" });

    if (exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized to delete this exam" });
    }

    await exam.deleteOne();
    res.json({ message: "Exam deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle publish status
router.put("/toggle/:id", authenticate, requireMentor, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ error: "Exam not found" });

    exam.isPublished = !exam.isPublished;
    await exam.save();
    res.json({ message: `Exam ${exam.isPublished ? "published" : "unpublished"}`, exam });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
