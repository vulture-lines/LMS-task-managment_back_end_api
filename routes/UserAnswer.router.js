const express = require("express");
const router = express.Router();
const User = require("../models/User.model");
const Exam = require("../models/Exam.model");
const UserAnswer = require("../models/UserAnswer.model");
const authenticate = require("../middleware/auth");

// Submit answers (max 5 attempts)
router.post("/submit/:examId", authenticate, async (req, res) => {
  try {
    const { answers: submittedAnswers, completedDuration } = req.body;
    const examId = req.params.examId;

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ error: "Exam not found" });

    const user = await User.findById(req.user._id);
    let existing = await UserAnswer.findOne({ user: user._id, examId });

    if (existing && existing.attempts.length >= 5) {
      return res.status(403).json({ error: "Maximum 5 attempts allowed" });
    }

    const answers = [];
    let score = 0;

    exam.questions.forEach(q => {
      const submitted = submittedAnswers.find(a => a.question === q.question);
      if (submitted) {
        const isCorrect = submitted.selected === q.correctAnswer;
        if (isCorrect) score += 2;

        answers.push({
          question: q.question,
          selected: submitted.selected,
          correct: q.correctAnswer,
          isCorrect
        });
      }
    });

    const percentage = Math.round((score / (exam.questions.length * 2)) * 100);
    const newAttempt = {
      answers,
      score,
      percentage,
      completedDuration,
      isCompleted: true
    };

    if (!existing) {
      existing = await UserAnswer.create({
        user: user._id,
        username: user.username,
        examId,
        examTitle: exam.title,
        courseId: exam.courseId,
        courseTitle: exam.courseTitle,
        numberOfQuestions: exam.questions.length,
        totalMarks: exam.questions.length * 2,
        attempts: [newAttempt],
        bestScore: score,
        bestPercentage: percentage
      });
    } else {
      existing.attempts.push(newAttempt);
      if (score > existing.bestScore) {
        existing.bestScore = score;
        existing.bestPercentage = percentage;
      }
      await existing.save();
    }

    // Recalculate ranks
    const all = await UserAnswer.find({ examId }).sort({ bestScore: -1 });
    for (let i = 0; i < all.length; i++) {
      all[i].rank = i + 1;
      await all[i].save();
    }

    res.status(201).json({ message: "Submitted successfully", score, percentage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user's results
router.get("/result/:examId", authenticate, async (req, res) => {
  try {
    const result = await UserAnswer.findOne({
      user: req.user._id,
      examId: req.params.examId
    });
    if (!result) return res.status(200).json({ message: "No submission yet", result: null });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get ranking for an exam
router.get("/ranking/:examId", authenticate, async (req, res) => {
  try {
    const rankings = await UserAnswer.find({ examId: req.params.examId })
      .select("username bestScore bestPercentage rank")
      .sort({ bestScore: -1 });
    res.json(rankings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all submissions (mentor-only)
router.get("/all", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "Mentor") {
      return res.status(403).json({ error: "Only mentors can view all submissions" });
    }

    const submissions = await UserAnswer.find()
      .sort({ createdAt: -1 })
      .select("username courseTitle examTitle bestScore bestPercentage rank numberOfQuestions totalMarks attempts createdAt")
      .populate("user", "username")
      .populate("examId", "title");

    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
