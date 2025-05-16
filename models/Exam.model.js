const { Schema, model } = require("mongoose");

const questionSchema = new Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: String, required: true },
  explanation: { type: String }
}, { _id: false });

const examSchema = new Schema({
  title: { type: String, required: true },
  subject: { type: String }, 
  courseId: { type: Schema.Types.ObjectId, ref: "Course" },
  courseTitle: { type: String, required: true },
  duration: { type: Number, required: true }, // in minutes
  totalMarks: { type: Number, default: 0 },
  questions: [questionSchema],
  createdBy: { type: Schema.Types.ObjectId, ref: "User" }, 
  isPublished: { type: Boolean, default: false },
  tags: [String]
}, { timestamps: true });

examSchema.pre('save', function (next) {
  this.totalMarks = this.questions.length * 2; // 2 marks per question
  next();
});

module.exports = model("Exam", examSchema);
