const { Schema, model } = require("mongoose");

const CourseProgressSchema = new Schema({
  courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
  courseTitle: { type: String },
  completedLessons: [
    {
      lessonIndex: Number,
      isLessonCompleted: { type: Boolean, default: false },
      sublessons: [
        {
          sublessonIndex: Number,
          isCompleted: { type: Boolean, default: true } 
        }
      ],
      percentage: { type: Number, default: 0 }
    }
  ],
  completedLessonCount: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  isCompleted: { type: Boolean, default: false }
}, { _id: false });


const userSchema = new Schema({
  firstName:   { type: String},
  lastName:    { type: String},
  username:    { type: String, required: true, unique: true },
  email:       { type: String, required: true, unique: true },
  password:    { type: String },
  profilepic:  { type: String},
  profilebanner: { type: String},
  socialId:    {type: String,required: [false, 'Social media ID required'],unique: true,sparse: true  }, // For Google sign-in
  enrolledCourses: [{
    courseId: { type: Schema.Types.ObjectId, ref: "Course" },
    enrolledAt: { type: Date, default: Date.now },
    expiryDate: { type: Date, default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }, // 1 year default
    isApproved: { type: Boolean, default: false }
  }],
  
  courseProgress:  {type: [CourseProgressSchema], default: [] },
  dob:         { type: Date },
  gender:      { type: String, enum: ["Male", "Female", "Others"] },
  phone:         { type: String, unique: true, sparse: true }, 
  address:       { type: String }, 
  education:     { type: String },
  isApproved:  { type: Boolean, default: false }, // Admin approval required
  role:        { type: String, enum: ["Mentor", "Student"], default: "Student" },
  token:       { type: String }
}, { timestamps: true });

module.exports = model("User", userSchema);
