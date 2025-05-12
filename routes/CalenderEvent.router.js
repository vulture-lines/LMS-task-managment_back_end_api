const express = require("express");
const router = express.Router();
const Event = require("../models/CalenderEvent.model");
const authenticate = require("../middleware/auth");

// router.post("/", authenticate, async (req, res) => {
//   try {
//     const { title, startDate, endDate } = req.body;

//     const event = new Event({
//       userId: req.user._id,
//       title,
//       startDate,
//       endDate
//     });

//     await event.save();
//     res.status(201).json({ message: "Event created", event });
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });

router.post("/", authenticate, async (req, res) => {
  try {
    const { title, startDate, endDate, link } = req.body;

    const isMentor = req.user.role === 'Mentor';

    const event = new Event({
      userId: req.user._id,
      title,
      startDate,
      endDate,
      link,
      isPublic: isMentor, // true only if mentor creates it
    });

    await event.save();
    res.status(201).json({ message: "Event created", event });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// router.get("/", authenticate, async (req, res) => {
//   try {
//     const events = await Event.find({ userId: req.user._id }).sort({ startDate: 1 });
//     res.json(events);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });
router.get("/", authenticate, async (req, res) => {
  try {
    const events = await Event.find({
      $or: [
        { userId: req.user._id },
        { isPublic: true }
      ]
    }).sort({ startDate: 1 });

    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get("/:id", authenticate, async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, userId: req.user._id });
    if (!event) return res.status(404).json({ error: "Event not found" });

    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.put("/:id", authenticate, async (req, res) => {
  try {
    const { title, startDate, endDate } = req.body;

    const event = await Event.findOne({ _id: req.params.id, userId: req.user._id });
    if (!event) return res.status(404).json({ error: "Event not found" });

    if (title) event.title = title;
    if (startDate) event.startDate = new Date(startDate);
    if (endDate) event.endDate = new Date(endDate);

    await event.save();
    res.json({ message: "Event updated", event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", authenticate, async (req, res) => {
  try {
    const deleted = await Event.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!deleted) return res.status(404).json({ error: "Event not found" });

    res.json({ message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get("/filter", authenticate, async (req, res) => {
  try {
    const { type } = req.query; // ?type=week or ?type=month
    const now = new Date();
    let start, end;

    if (type === "week") {
      const day = now.getDay(); // 0 (Sun) to 6 (Sat)
      const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(now.setDate(diffToMonday));
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(end.getDate() + 7);
    } else if (type === "month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    } else {
      return res.status(400).json({ error: "Invalid filter type. Use 'week' or 'month'." });
    }

    const events = await Event.find({
      userId: req.user._id,
      startDate: { $gte: start, $lt: end }
    }).sort({ startDate: 1 });

    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
