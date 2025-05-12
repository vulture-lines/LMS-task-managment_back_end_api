const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification.model");
const authenticate = require("../middleware/auth");


const requireMentor = (req, res, next) => {
  if (req.user.role !== "Mentor") {
    return res.status(403).json({ error: "Only mentors can perform this action" });
  }
  next();
};


// router.get("/", authenticate, async (req, res) => {
//   try {
//     const notifications = await Notification.find().sort({ createdAt: -1 });

//     const enriched = notifications.map(n => ({
//       _id: n._id,
//       title: n.title,
//       message: n.message,
//       createdAt: n.createdAt,
//       isRead: n.readBy.includes(req.user._id)
//     }));

//     res.json(enriched);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });
router.get("/", authenticate, async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [
        { targetUser: null }, // Global notification
        { targetUser: req.user._id } // Personal notification
      ],
      readBy: { $ne: req.user._id } // Exclude read notifications
    }).sort({ createdAt: -1 });

    const enriched = notifications.map(n => ({
      _id: n._id,
      title: n.title,
      message: n.message,
      type: n.type,
      createdAt: n.createdAt,
      isRead: false // Since these are unread by this user
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// router.get("/", authenticate, async (req, res) => {
//   try {
//     const notifications = await Notification.find({
//       $or: [
//         { targetUser: null }, // global notification
//         { targetUser: req.user._id } // personal notification
//       ]
//     }).sort({ createdAt: -1 });

//     const enriched = notifications.map(n => ({
//       _id: n._id,
//       title: n.title,
//       message: n.message,
//       type: n.type,
//       createdAt: n.createdAt,
//       isRead: n.readBy.includes(req.user._id)
//     }));

//     res.json(enriched);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

router.post("/", authenticate, requireMentor, async (req, res) => {
  try {
    const { title, message, type } = req.body;
    const notification = new Notification({title,message,...(type && { type }) });
    await notification.save();
    res.status(201).json({ message: "Notification created", notification });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id", authenticate, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ error: "Notification not found" });

    if (!notification.readBy.includes(req.user._id)) {
      notification.readBy.push(req.user._id);
      await notification.save();
    }

    res.json({ message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", authenticate, requireMentor, async (req, res) => {
  try {
    const deleted = await Notification.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Notification not found" });
    res.json({ message: "Notification deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
