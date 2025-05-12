const { Schema, model } = require("mongoose");

const courseAchievementSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  username: { type: String, required: true },
  courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
  courseTitle: { type: String, required: true },
  certificateUrl: { type: String },
  completedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = model("CourseAchievement", courseAchievementSchema);
