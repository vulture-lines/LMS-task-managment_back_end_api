const { Schema, model } = require("mongoose");

const userAnswerSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  username: { type: String },
  examId: { type: Schema.Types.ObjectId, ref: "Exam", required: true },
  examTitle: { type: String },
  courseId: { type: Schema.Types.ObjectId, ref: "Course" },
  courseTitle: { type: String },

  numberOfQuestions: { type: Number, default: 0 },
  totalMarks: { type: Number, default: 0 },

  attempts: [{
    answers: [{
      question: String,
      selected: String,
      correct: String,
      isCorrect: Boolean
    }],
    score: { type: Number },
    submittedAt: { type: Date, default: Date.now },
    percentage: Number,
    completedDuration: { type: Number },  
    isCompleted: { type: Boolean, default: true }
  }],

  bestScore: { type: Number, default: 0 },
  bestPercentage: { type: Number, default: 0 },
  rank: { type: Number }
}, { timestamps: true });

module.exports = model("UserAnswer", userAnswerSchema);
