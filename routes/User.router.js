
const express = require("express");
const router = express.Router();
const User = require("../models/User.model");
const authenticate = require("../middleware/auth");

// Check if user is Mentor
function requireMentor(req, res, next) {
  if (req.user.role !== "Mentor") {
    return res.status(403).json({ error: "Only Mentors can perform this action" });
  }
  next();
}

// Check if user is Admin 
function requireAdmin(req, res, next) {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: "Only Admins can perform this action" });
  }
  next();
}


//all users
router.get("/", authenticate, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// user by ID
router.get("/:id", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// edit user by ID
router.put("/:id", authenticate, async (req, res) => {
  try {
    const {
      password,
      socialId,
      courseProgress,
      isApproved,
      role,
      token,
      ...allowedUpdates
    } = req.body;

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      allowedUpdates,
      { new: true }
    ).select("-password");

    if (!updated) return res.status(404).json({ error: "User not found" });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/admin/:id", authenticate, async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select("-password");
    if (!updated) return res.status(404).json({ error: "User not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete by ID
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

//Mentor approves a student to login (isApproved = true)
router.put("/approve/:userId", authenticate, requireMentor, async (req, res) => {
    try {
      const user = await User.findById(req.params.userId);
      if (!user) return res.status(404).json({ error: "User not found" });
  
      user.isApproved = !user.isApproved; 
      await user.save();
  
      res.json({ message: `User approval set to ${user.isApproved}`, user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

// Change user role (Mentor <-> Student)
router.put("/change-role/:userId", authenticate, requireMentor, async (req, res) => {
    try {
      const { role } = req.body;
      if (!["Mentor", "Student"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      const user = await User.findById(req.params.userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      if (user.role === "Mentor" && role === "Student") {
        user.isApproved = false;
      }
      user.role = role;
      await user.save();
      res.json({ message: `User role changed to ${role}`, user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });
  

  // Approve user's course enrollment
  router.put("/approve/:userId/:courseId", authenticate, requireMentor, async (req, res) => {
    try {
      const { userId, courseId } = req.params;
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      const course = user.enrolledCourses.find(
        c => c.courseId.toString() === courseId
      );
  
      if (!course) return res.status(404).json({ error: "Enrollment not found" });
      // Toggle approval status
      course.isApproved = !course.isApproved;
      await user.save();
  
      res.json({
        message: `Enrollment ${course.isApproved ? "approved" : "unapproved"}`,
        isApproved: course.isApproved
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
 

// Update expiry date of enrollment
router.put("/update-expiry/:userId/:courseId", authenticate,requireMentor, async (req, res) => {
  try {
    const { userId, courseId } = req.params;
    const { expiryDate } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const course = user.enrolledCourses.find(
      c => c.courseId.toString() === courseId
    );

    if (!course) return res.status(404).json({ error: "Enrollment not found" });

    course.expiryDate = new Date(expiryDate);
    await user.save();

    res.json({ message: "Course expiry updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin view: List all users with expired enrollments
router.get("/expired", authenticate, async (req, res) => {
  try {
    const users = await User.find({
      "enrolledCourses.expiryDate": { $lte: new Date() }
    }).select("username email enrolledCourses");

    const expiredData = users.map(user => {
      const expiredCourses = user.enrolledCourses.filter(c => new Date(c.expiryDate) < new Date());
      return {
        userId: user._id,
        username: user.username,
        email: user.email,
        expiredCourses
      };
    }).filter(u => u.expiredCourses.length > 0);

    res.json(expiredData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
