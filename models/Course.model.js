const { Schema, model } = require("mongoose");

// Sublesson Schema
const sublessonSchema = new Schema({
  title: { type: String, required: false },
  file: {
    url: String,
    type: { type: String, }
  },
  test: {
    questions: [
      {
        question: { type: String },
        options: [String],
        answer: { type: String } 
      }
    ]
  }
}, { _id: false });

// Lesson Schema
const lessonSchema = new Schema({
  title: { type: String, required: true },
  sublessons: [sublessonSchema]
}, { _id: false });

// Course Schema
const courseSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  thumbnail: String,
  price: {
    type: Number,
    default: 0
  },
  mentor: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  mentorName: {
    type: String 
  },
  tags: [String],
  lessons: [lessonSchema],
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: Date
}, { timestamps: true });

module.exports = model("Course", courseSchema);
