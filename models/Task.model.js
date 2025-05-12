const { Schema, model } = require("mongoose");

const submissionSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  username: { type: String, required: true }, 
  file: {
    url: String,
    type: String 
  },
  driveLink: { type: String }, 
  submittedAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["not_uploaded", "uploaded", "for_review", "approved", "rejected","late submission","resubmit"],
    default: "not_uploaded"
  },
  markGiven: { type: Number, default: null },
  reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
  reviewNote: { type: String }
}, { _id: false });

const taskSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  file: { 
    url: String,
    type: String
  },
  maxMarks: { type: Number, default: 10 },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }, 
  assignedTo: [
    {
      user: { type: Schema.Types.ObjectId, ref: "User" },
      username: { type: String }
    }
  ],
  dueDate: { type: Date },
  submissions: [submissionSchema]
}, { timestamps: true });

module.exports = model("Task", taskSchema);
