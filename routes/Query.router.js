const express = require("express");
const router = express.Router();
const QueryTicket = require("../models/Query.model");
const User = require("../models/User.model");
const Course = require("../models/Course.model");
const authenticate = require("../middleware/auth");

const requireMentor = (req, res, next) => {
  if (req.user.role !== "Mentor") {
    return res.status(403).json({ error: "Only mentors can perform this action" });
  }
  next();
};

// Create a new ticket (Student)
router.post("/", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "Student") {
      return res.status(403).json({ error: "Only students can raise tickets" });
    }

    const { course, title, issue } = req.body;

    const student = await User.findById(req.user._id).select("username");
    const courseData = course ? await Course.findById(course).select("title") : null;

    const ticket = new QueryTicket({
      raisedBy: req.user._id,
      studentName: student.username,
      course: course || null,
      courseTitle: courseData?.title || null,
      title,
      issue
    });

    await ticket.save();
    res.status(201).json({ message: "Ticket created", ticket });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all tickets (Mentor only)
router.get("/", authenticate, requireMentor, async (req, res) => {
  try {
    const tickets = await QueryTicket.find().sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get tickets for current student
router.get("/student", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "Student") {
      return res.status(403).json({ error: "Only students can view their tickets" });
    }
    const tickets = await QueryTicket.find({ raisedBy: req.user._id }).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single ticket by ID
router.get("/:id", authenticate, async (req, res) => {
  try {
    const ticket = await QueryTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    // Students can only view their own tickets
    if (req.user.role === "Student" && ticket.raisedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Accept/update a ticket (Mentor only)
router.put("/accept/:id", authenticate, requireMentor, async (req, res) => {
  try {
    const { meetingLink, meetingTime, expiresAt, responseMessage, notes } = req.body;

    const ticket = await QueryTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    const mentor = await User.findById(req.user._id).select("username");

    ticket.status = "Accepted";
    ticket.acceptedBy = req.user._id;
    ticket.mentorName = mentor.username;
    ticket.meetingLink = meetingLink;
    ticket.meetingTime = meetingTime;
    ticket.expiresAt = expiresAt;
    ticket.responseMessage = responseMessage;
    ticket.notes = notes;

    await ticket.save();

    res.json({ message: "Ticket accepted and updated", ticket });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
