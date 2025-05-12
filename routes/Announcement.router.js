const express = require("express");
const router = express.Router();
const Announcement = require("../models/Announcement.model");
const authenticate = require("../middleware/auth");


function requireMentor(req, res, next) {
  if (req.user.role !== "Mentor") {
    return res.status(403).json({ error: "Only mentors can perform this action" });
  }
  next();
}

// Create (Mentor only)
router.post("/", authenticate, requireMentor, async (req, res) => {
  try {
    const announcement = new Announcement({
      ...req.body,
      creator: req.user._id
    });
    await announcement.save();
    res.status(201).json({ message: "Announcement created", announcement });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all(global + optional course)
router.get("/", authenticate, async (req, res) => {
  try {
    const filter = {};
    if (req.query.courseId) {
      filter.course = req.query.courseId;
    }
    const announcements = await Announcement.find(filter)
      .sort({ createdAt: -1 })
      .populate("creator", "username");
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get("/all", authenticate, async (req, res) => {
    try {
      const filter = {
        $or: [
          { expiresAt: null },
          { expiresAt: { $gt: new Date() } }
        ]
      };
      if (req.query.courseId) {
        filter.course = req.query.courseId;
      }
      if (req.query.isPinned !== undefined) {
        filter.isPinned = req.query.isPinned === "true";
      }
      const announcements = await Announcement.find(filter)
        .sort({ createdAt: -1 })
        .populate("creator", "username");
      res.json(announcements);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });


router.get("/:id", authenticate, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id).populate("creator", "username");
    if (!announcement) return res.status(404).json({ error: "Announcement not found" });
    res.json(announcement);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update(Mentor only)
router.put("/:id", authenticate, requireMentor, async (req, res) => {
  try {
    const updated = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: "Announcement not found" });
    res.json({ message: "Announcement updated", updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete(Mentor only)
router.delete("/:id", authenticate, requireMentor, async (req, res) => {
  try {
    const deleted = await Announcement.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Announcement not found" });
    res.json({ message: "Announcement deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
