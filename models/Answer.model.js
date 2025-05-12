const { Schema, model } = require("mongoose");

const answerSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  username: { type: String, required: true }, 
  courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
  courseTitle: { type: String, required: true },
  sublessonIndex: { type: Number, required: true },
  sublessonTitle: { type: String, required: true },
  totalMarks: { type: Number, default: 0 },
  bestScore: { type: Number, default: 0 },
  bestPercentage: { type: Number, default: 0 },
  rank: { type: Number, default: null }, 

  attempts: [
    {
      submittedAt: { type: Date, default: Date.now },
      answers: [
        {
          question: String,
          selected: String,
          correct: String,
          isCorrect: Boolean
        }
      ],
      score: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 }
    }
  ]
}, { timestamps: true });


answerSchema.pre("save", function (next) {
  const maxAttempts = 5;
  const marksPerCorrect = 2;

  if (this.attempts.length > maxAttempts) {
    this.attempts = this.attempts.slice(-maxAttempts);
  }

  this.attempts.forEach(attempt => {
    const correctCount = attempt.answers.filter(a => a.isCorrect).length;
    const totalQuestions = attempt.answers.length || 1;
    const score = correctCount * marksPerCorrect;
    const percentage = Math.round((score / (totalQuestions * marksPerCorrect)) * 100);

    attempt.score = score;
    attempt.percentage = percentage;
  });

  const questions = this.attempts[0]?.answers?.length || 0;
  this.totalMarks = questions * marksPerCorrect;

  const best = this.attempts.reduce(
    (acc, att) => (att.score > acc.score ? att : acc),
    { score: 0, percentage: 0 }
  );

  this.bestScore = best.score;
  this.bestPercentage = best.percentage;

  next();
});

module.exports = model("Answer", answerSchema);
