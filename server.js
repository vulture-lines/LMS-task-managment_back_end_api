const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
app.use(express.json());


// const allowedOrigins = ["https://lms-course-sigma.vercel.app"];
app.use(cors({ origin: "*", credentials: true }));
// app.use(cors({
//   origin: function (origin, callback) {
//     // allow requests with no origin like mobile apps or curl
//     if (!origin) return callback(null, true);
//     if (allowedOrigins.includes(origin)) {
//       return callback(null, true);
//     } else {
//       return callback(new Error("Not allowed by CORS"));
//     }
//   },
//   credentials: true
// }));


const PORT = process.env.PORT || 5000;


// Import routes
const authRoutes = require("./routes/Auth.router");
const userRoutes = require("./routes/User.router");
const calenderRoutes = require("./routes/CalenderEvent.router");
const courseRoutes = require("./routes/Course.router");
const courseAchieveRoutes = require("./routes/CourseAchieve.router");
const courseProgress = require("./routes/CourseProgress.router");
const answerRoutes = require("./routes/Answer.router");
const enrollmentRoutes = require("./routes/Enroll.router");
const forumRoutes = require("./routes/Forum.router");
const messageRoutes = require("./routes/Message.router")
const notificationRoutes = require("./routes/Notification.router");
const announceRoutes = require("./routes/Announcement.router");
const queryRoutes = require("./routes/Query.router");
const signupLimitRoutes = require("./routes/SignupLimit.router");
const taskRoutes = require("./routes/Task.router");
const taskAchieveRoutes = require("./routes/TaskAchieve.router");
const todosRoutes = require("./routes/Todo.router");
const uploadRoutes = require("./routes/Upload.router");
const examRoutes = require("./routes/Exam.router");
const userAnswerRoutes = require("./routes/UserAnswer.router");

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/users",userRoutes);
app.use("/api/calender", calenderRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/courseAchievements", courseAchieveRoutes);
app.use("/api/courseProgress", courseProgress);
app.use("/api/answers", answerRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/forum", forumRoutes);
app.use("/api/message",messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/announcements",announceRoutes);
app.use("/api/queries", queryRoutes);
app.use("/api/signuplimit",signupLimitRoutes);
app.use("/api/tasks",taskRoutes);
app.use("/api/taskAchievements", taskAchieveRoutes);
app.use("/api/todo",todosRoutes)
app.use("/api/upload",uploadRoutes);
app.use("/api/exam",examRoutes);
app.use("/api/useranswer",userAnswerRoutes);

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));


  app.get("/", (req, res) => {
    res.send("Welcome to LMS API");
  });
  
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
  