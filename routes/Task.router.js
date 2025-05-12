const express = require("express");
const router = express.Router();
const Task = require("../models/Task.model");
const User = require("../models/User.model");
const Notification = require("../models/Notification.model");
const authenticate = require("../middleware/auth");

const requireMentor = (req, res, next) => {
  if (req.user.role !== "Mentor") {
    return res.status(403).json({ error: "Only mentors can perform this action" });
  }
  next();
};

router.post("/", authenticate, requireMentor, async (req, res) => {
  try {
    const { title, description, file, maxMarks, assignedTo = [], dueDate } = req.body;

    let assignedList = [];

    if (assignedTo.length === 0) {
      const students = await User.find({ role: "Student" });
      assignedList = students.map(user => ({ user: user._id, username: user.username }));
    } else {
      const users = await User.find({ _id: { $in: assignedTo } });
      assignedList = users.map(u => ({ user: u._id, username: u.username }));
    }

    const task = new Task({
      title,
      description,
      file,
      maxMarks,
      dueDate,
      createdBy: req.user._id,
      assignedTo: assignedList
    });
    await task.save();
    // Notify assigned users
    for (const u of assignedList) {
      await Notification.create({
        title: "New Task Assigned",
        message: `You have a new task "${title}" due on ${new Date(dueDate).toLocaleDateString()}`,
        targetUser: u.user
      });
    }
    res.status(201).json({ message: "Task created", task });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:taskId", authenticate, requireMentor, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, file, maxMarks, assignedTo = [], dueDate } = req.body;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });

    // Update fields
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (file) task.file = file;
    if (maxMarks !== undefined) task.maxMarks = maxMarks;
    if (dueDate) task.dueDate = dueDate;

    // Handle reassignment of users (optional)
    if (assignedTo.length > 0) {
      const users = await User.find({ _id: { $in: assignedTo } });
      task.assignedTo = users.map(u => ({ user: u._id, username: u.username }));
      // Reset submissions when reassigned (optional logic)
      task.submissions = task.submissions.filter(sub =>
        assignedTo.includes(sub.user.toString())
      );
    }

    await task.save();

    res.json({ message: "Task updated successfully", task });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Submit assignment (Student)
router.post("/submit/:taskId", authenticate, async (req, res) => {
  try {
    const { file, driveLink } = req.body;
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });

    const userId = req.user._id.toString();
    const existing = task.submissions.find(s => s.user.toString() === userId);

    const now = new Date();
    const isLate = task.dueDate && now > new Date(task.dueDate);
    const newStatus = isLate ? "late submission" : "for_review";

    if (existing) {
      if (!["resubmit", "not submitted"].includes(existing.status)) {
        return res.status(400).json({ error: `You can only resubmit if status is 'resubmit' or 'not submitted'. Current status: ${existing.status}` });
      }
      existing.file = file;
      existing.driveLink = driveLink;
      existing.status = newStatus;
      existing.submittedAt = now;
    } else {
      task.submissions.push({
        user: req.user._id,
        username: req.user.username,
        file,
        driveLink,
        status: newStatus,
        submittedAt: now
      });
    }

    await task.save();

    // Notify mentor
    await Notification.create({
      title: "Task Submitted",
      message: `${req.user.username} submitted the task "${task.title}"`,
      targetUser: task.createdBy
    });

    res.json({ message: isLate ? "Submitted (Late)" : "Submitted", status: newStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// router.post("/submit/:taskId", authenticate, async (req, res) => {
//   try {
//     const { file, driveLink } = req.body;
//     const task = await Task.findById(req.params.taskId);
//     if (!task) return res.status(404).json({ error: "Task not found" });

//     const existing = task.submissions.find(s => s.user.toString() === req.user._id.toString());

//     const submission = {
//       user: req.user._id,
//       username: req.user.username,
//       file,
//       driveLink,
//       status: "for_review",
//       submittedAt: new Date()
//     };

//     if (existing) Object.assign(existing, submission);
//     else task.submissions.push(submission);

//     await task.save();

//     // Notify mentor
//     await Notification.create({
//       title: "Task Submitted",
//       message: `${req.user.username} submitted the task "${task.title}"`,
//       targetUser: task.createdBy
//     });

//     res.json({ message: "Submitted", submission });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// Mentor review
router.put("/review/:taskId/:userId", authenticate, requireMentor, async (req, res) => {
  try {
    const { status, markGiven, reviewNote } = req.body;
    const { taskId, userId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });

    const sub = task.submissions.find(s => s.user.toString() === userId);
    if (!sub) return res.status(404).json({ error: "Submission not found" });

    if (status && ["approved", "not approved", "for_review", "resubmit"].includes(status)) {
      sub.status = status;
    }

    if (markGiven !== undefined) sub.markGiven = markGiven;
    if (reviewNote) sub.reviewNote = reviewNote;
    sub.reviewedBy = req.user._id;

    await task.save();

    await Notification.create({
      title: `Task Reviewed: ${status}`,
      message: `Your submission for "${task.title}" was marked as "${status}".`,
      targetUser: userId
    });

    res.json({ message: "Reviewed", submission: sub });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// router.put("/review/:taskId/:userId", authenticate, requireMentor, async (req, res) => {
//   try {
//     const { status, markGiven, reviewNote } = req.body;
//     const { taskId, userId } = req.params;

//     const task = await Task.findById(taskId);
//     if (!task) return res.status(404).json({ error: "Task not found" });

//     const sub = task.submissions.find(s => s.user.toString() === userId);
//     if (!sub) return res.status(404).json({ error: "Submission not found" });

//     if (status && ["approved", "rejected", "for_review"].includes(status)) {
//       sub.status = status;
//     }

//     if (markGiven !== undefined) sub.markGiven = markGiven;
//     if (reviewNote) sub.reviewNote = reviewNote;
//     sub.reviewedBy = req.user._id;

//     await task.save();

//     await Notification.create({
//       title: `Task ${status === "approved" ? "Approved" : "Rejected"}`,
//       message: `Your submission for "${task.title}" was ${status}.`,
//       targetUser: userId
//     });

//     res.json({ message: "Reviewed", submission: sub });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

router.get("/", authenticate, async (req, res) => {
  try {
    const tasks = await Task.find({
      $or: [
        { "assignedTo.user": req.user._id },
        { assignedTo: { $size: 0 } },
        { createdBy: req.user._id }
      ]
    }).sort({ createdAt: -1 });

    const tasksWithStatus = tasks.map(task => {
      const submission = task.submissions.find(s => s.user.toString() === req.user._id.toString());

      let status = "not_uploaded";
      if (submission) {
        status = submission.status;
      } else if (task.createdBy.toString() === req.user._id.toString()) {
        status = "not_submitted";
      }
      else if (!submission && new Date() > new Date(task.dueDate)) {
      status = "overdue";
      }

      return {
        _id: task._id,
        title: task.title,
        maxMarks: task.maxMarks,
        description: task.description,
        dueDate: task.dueDate,
        status,
        createdBy: task.createdBy,
        file: task.file,
        mySubmission: submission || null,
        createdAt: task.createdAt
      };
    });

    res.json(tasksWithStatus);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// Get all tasks and submission status per assigned user
// router.get("/all", authenticate, requireMentor, async (req, res) => {
//   try {
//     const tasks = await Task.find({ createdBy: req.user._id }).sort({ createdAt: -1 });

//     const detailedTasks = tasks.map(task => {
//       const assignedDetails = task.assignedTo.map(assign => {
//         const submission = task.submissions.find(
//           s => s.user.toString() === assign.user.toString()
//         );

//         return {
//           user: assign.user,
//           username: assign.username,
//           status: submission?.status || "not_submitted",
//           markGiven: submission?.markGiven || null,
//           reviewedBy: submission?.reviewedBy || null,
//           submittedAt: submission?.submittedAt || null
//         };
//       });

//       return {
//         _id: task._id,
//         title: task.title,
//         maxMarks: task.maxMarks,
//         dueDate: task.dueDate,
//         createdAt: task.createdAt,
//         assignedTo: assignedDetails
//       };
//     });

//     res.json(detailedTasks);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });


router.get("/all", authenticate, requireMentor, async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });

    const detailedTasks = tasks.map(task => {
      const assignedDetails = task.assignedTo.map(assign => {
        const submission = task.submissions.find(
          s => s.user.toString() === assign.user.toString()
        );

        return {
          user: assign.user,
          username: assign.username,
          status: submission?.status || "not_submitted",
          markGiven: submission?.markGiven || null,
          reviewedBy: submission?.reviewedBy || null,
          submittedAt: submission?.submittedAt || null
        };
      });

      return {
        _id: task._id,
        title: task.title,
        fileUrl: task.file?.url || null,
        maxMarks: task.maxMarks,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
        createdBy: task.createdBy,
        assignedTo: assignedDetails
      };
    });

    res.json(detailedTasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:taskId", authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });

    const mySubmission = task.submissions.find(
      s => s.user.toString() === req.user._id.toString()
    );

    res.json({
      ...task.toObject(),
      mySubmission: mySubmission || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;
