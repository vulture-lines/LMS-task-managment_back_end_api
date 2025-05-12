const express = require("express");
const router = express.Router();
const Answer = require("../models/Answer.model");
const Course = require("../models/Course.model");
const User = require("../models/User.model");
const Notification = require("../models/Notification.model");
const authenticate = require("../middleware/auth");

const requireMentor = (req, res, next) => {
  if (req.user.role !== "Mentor") {
    return res.status(403).json({ error: "Only mentors allowed" });
  }
  next();
};

router.post("/:courseId/:sublessonIndex", authenticate, async (req, res) => {
  try {
    const { courseId, sublessonIndex } = req.params;
    const { answers = [], sublessonTitle } = req.body;

    if (!answers.length) return res.status(400).json({ error: "Answers required" });

    const course = await Course.findById(courseId);
    const user = await User.findById(req.user._id);

    if (!course || !user) return res.status(404).json({ error: "Course or User not found" });

    let answer = await Answer.findOne({ user: user._id, courseId, sublessonIndex });

    const attempt = {
      submittedAt: new Date(),
      answers: answers.map(q => ({
        question: q.question,
        selected: q.selected,
        correct: q.correct,
        isCorrect: q.selected === q.correct
      }))
    };

    if (!answer) {
      answer = new Answer({
        user: user._id,
        username: user.username,
        courseId,
        courseTitle: course.title,
        sublessonIndex,
        sublessonTitle,
        attempts: [attempt]
      });
    } else {
      answer.attempts.push(attempt);
    }

    await answer.save();

    // Rank update logic
    const all = await Answer.find({ courseId, sublessonIndex });
    const previousRanks = {};
    for (const a of all) previousRanks[a.user.toString()] = a.rank || null;

    const sorted = all.sort((a, b) => b.bestScore - a.bestScore);

    for (let i = 0; i < sorted.length; i++) {
      const newRank = i + 1;
      const answerDoc = sorted[i];
      const oldRank = previousRanks[answerDoc.user.toString()];

      if (oldRank && newRank !== oldRank) {
        const message = newRank < oldRank
          ? ` Your rank improved from ${oldRank} to ${newRank}`
          : ` Your rank dropped from ${oldRank} to ${newRank}`;

        await Notification.create({
          title: "Rank Changed",
          message: message,
          targetUser: answerDoc.user
        });
      }

      answerDoc.rank = newRank;
      await answerDoc.save();
    }

    res.status(201).json({ message: "Attempt submitted", answer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get leaderboard for a specific course and sublesson
router.get("/rank/:courseId/:sublessonIndex", authenticate, async (req, res) => {
  try {
    const { courseId, sublessonIndex } = req.params;

    const answers = await Answer.find({ courseId, sublessonIndex })
      .sort({ bestScore: -1 });

    const leaderboard = answers.map((a, index) => ({
      username: a.username,
      bestScore: a.bestScore,
      bestPercentage: a.bestPercentage,
      rank: index + 1
    }));

    const userRank = leaderboard.find(r => r.username === req.user.username);

    res.json({
      totalUsers: leaderboard.length,
      userRank: userRank || null,
      leaderboard: leaderboard.slice(0, 10)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// router.get("/:userId",async (req, res) => {
//     try {
//       const { userId } = req.params;
//       const answers = await Answer.find({ user: userId })

//       if (!answers || answers.length === 0) {
//         return res.status(404).json({ message: "No answers found for this user" });
//       }
//       return res.status(200).json({
//         message: "User details fetched successfully",
//         answers: answers
//       });
//     } catch (error) {
//       console.error("Error fetching user answers:", error);
//       return res.status(500).json({ message: "Server error" });
//     }
//   });
  router.get("/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const answers = await Answer.find({ user: userId });
  
      return res.status(200).json({
        message: "User answers fetched",
        answers: answers.length > 0 ? answers : null
      });
    } catch (error) {
      console.error("Error fetching user answers:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  

// Get user-wise detailed attempts for a sublesson
router.get("/user/:courseId/:sublessonIndex/:userId", authenticate, async (req, res) => {
  try {
    const { courseId, sublessonIndex, userId } = req.params;
    const answer = await Answer.findOne({ courseId, sublessonIndex, user: userId });

    if (!answer) return res.status(404).json({ error: "No answer record found" });

    res.json({
      username: answer.username,
      courseTitle: answer.courseTitle,
      sublessonTitle: answer.sublessonTitle,
      attempts: answer.attempts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mentor manually update answers 
router.put("/:id/attempt/:attemptIndex", authenticate, requireMentor, async (req, res) => {
  try {
    const { id, attemptIndex } = req.params;
    const { answers } = req.body;

    const answer = await Answer.findById(id);
    if (!answer) return res.status(404).json({ error: "Answer not found" });

    const attempt = answer.attempts[attemptIndex];
    if (!attempt) return res.status(404).json({ error: "Attempt not found" });

    if (!Array.isArray(answers)) {
      return res.status(400).json({ error: "Answers must be an array" });
    }

    attempt.answers = answers.map(q => ({
      question: q.question,
      selected: q.selected,
      correct: q.correct,
      isCorrect: q.selected === q.correct
    }));

    await answer.save();
    const all = await Answer.find({ courseId: answer.courseId, sublessonIndex: answer.sublessonIndex });
    const sorted = all.sort((a, b) => b.bestScore - a.bestScore);
    for (let i = 0; i < sorted.length; i++) {
      sorted[i].rank = i + 1;
      await sorted[i].save();
    }

    res.json({ message: "Answer updated and recalculated", answer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
