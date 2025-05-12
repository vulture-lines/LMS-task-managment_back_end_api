const express = require("express");
const router = express.Router();
const TaskAchievement = require("../models/TaskAchievement.model");
const User = require("../models/User.model");
const authenticate = require("../middleware/auth");

const requireMentor = (req, res, next) => {
  if (req.user.role !== "Mentor") {
    return res.status(403).json({ error: "Only mentors/admins allowed" });
  }
  next();
};

router.get("/", authenticate, requireMentor, async (req, res) => {
    try {
      const list = await TaskAchievement.find().sort({ createdAt: -1 });
      res.json(list);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

router.get("/:userId", authenticate, async (req, res) => {
  try {
    const achievements = await TaskAchievement.find({ user: req.params.userId });
    res.json(achievements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post("/", authenticate, requireMentor, async (req, res) => {
  try {
    const { title, description, badge, userId } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const achievement = await TaskAchievement.create({
      title,
      description,
      badge,
      user: user._id,
      username: user.username,
      assignedBy: req.user._id,
      assignedByUsername: req.user.username
    });

    res.status(201).json({ message: "Task achievement created", achievement });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


router.put("/:id", authenticate, requireMentor, async (req, res) => {
  try {
    const { title, description, badge } = req.body;

    const updated = await TaskAchievement.findByIdAndUpdate(
      req.params.id,
      { title, description, badge },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "Achievement not found" });

    res.json({ message: "Task achievement updated", updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


router.delete("/:id", authenticate, requireMentor, async (req, res) => {
  try {
    const result = await TaskAchievement.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: "Achievement not found" });

    res.json({ message: "Task achievement deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
