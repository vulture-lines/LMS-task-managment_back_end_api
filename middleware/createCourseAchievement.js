const CourseAchievement = require("../models/CourseAchievement.model");
const Course = require("../models/Course.model");

const createCourseAchievement = async (user) => {
  try {
    for (const progress of user.courseProgress) {
      if (!progress.isCompleted) continue;

      const alreadyExists = await CourseAchievement.findOne({
        user: user._id,
        courseId: progress.courseId
      });

      if (!alreadyExists) {
        const course = await Course.findById(progress.courseId);
        await CourseAchievement.create({
          user: user._id,
          username: user.username,
          courseId: progress.courseId,
          courseTitle: course.title,
          certificateUrl: `https://cdn.example.com/certificates/${user.username}-${progress.courseId}.pdf`
        });
      }
    }
  } catch (err) {
    console.error("Error creating course achievement:", err.message);
  }
};

module.exports = createCourseAchievement;
