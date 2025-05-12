const { Schema, model } = require("mongoose");

const announcementSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: "Course",
    default: null 
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    default: null
  },
  attachments: [
    {
      url: String,
      type: String
    }
  ]
}, { timestamps: true });

module.exports = model("Announcement", announcementSchema);
