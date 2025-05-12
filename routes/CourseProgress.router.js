const express = require("express");
const router = express.Router();
const User = require("../models/User.model");
const Course = require("../models/Course.model");
const Notification = require("../models/Notification.model");
const authenticate = require("../middleware/auth");
const createCourseAchievement = require("../middleware/createCourseAchievement");

router.post("/:userId/:courseId", authenticate, async (req, res) => {
  try {
    const { lessonIndex, sublessonIndex } = req.body;
    const { userId, courseId } = req.params;

    const user = await User.findById(userId);
    const course = await Course.findById(courseId);

    if (!user || !course) return res.status(404).json({ error: "User or course not found" });

    const totalLessons = course.lessons.length;
    const totalSubCounts = course.lessons.map(l => l.sublessons.length);
    const courseTitle = course.title;

    let progress = user.courseProgress.find(p => p.courseId.toString() === courseId);
    if (!progress) {
      progress = {
        courseId,
        courseTitle,
        completedLessons: []
      };
      user.courseProgress.push(progress);
    }

    progress.courseTitle = courseTitle;

    let lesson = progress.completedLessons.find(l => l.lessonIndex === lessonIndex);
    if (!lesson) {
      lesson = {
        lessonIndex,
        isLessonCompleted: false,
        sublessons: [],
        percentage: 0
      };
      progress.completedLessons.push(lesson);
    }

    const alreadyDone = lesson.sublessons.some(s => s.sublessonIndex === sublessonIndex);
    if (!alreadyDone) {
      lesson.sublessons.push({
        sublessonIndex,
        isCompleted: true
      });
    }

    // Update lesson completion
    const completedSubCount = lesson.sublessons.length;
    const totalSubCount = totalSubCounts[lessonIndex];
    lesson.percentage = Math.round((completedSubCount / totalSubCount) * 100);
    lesson.isLessonCompleted = completedSubCount === totalSubCount;

    // Count total sublessons in the course
    const totalCourseSubCount = totalSubCounts.reduce((sum, count) => sum + count, 0);

    // Count all completed sublessons across all lessons
    const completedSubTotal = progress.completedLessons.reduce((sum, l) => sum + l.sublessons.length, 0);
    
    progress.percentage = Math.round((completedSubTotal / totalCourseSubCount) * 100);
    progress.isCompleted = progress.percentage === 100;

    const completedLessonCount = progress.completedLessons.filter(l => l.isLessonCompleted).length;
    progress.completedLessonCount = completedLessonCount;

    if (progress.isCompleted) {
      await Notification.create({
        title: "🎓 Course Completed",
        message: `You’ve successfully completed the course "${course.title}".`,
        targetUser: user._id,
        type: "course"
      });
    }

    await user.save();
    res.json({ message: "Progress updated", progress });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:userId/:courseId", authenticate, async (req, res) => {
  try {
    const { userId, courseId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const progress = user.courseProgress.find(p => p.courseId.toString() === courseId);

    if (!progress) {
      return res.status(200).json({ message: "No progress yet", progress: null });
    }

    res.json({ progress });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/", authenticate, async (req, res) => {
  try {
    const users = await User.find({ "courseProgress.0": { $exists: true } })
      .select("username courseProgress");

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
