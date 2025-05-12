const { Schema, model } = require("mongoose");

const queryTicketSchema = new Schema({
  // Student info
  raisedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  studentName: {
    type: String,
    required: true
  },

  // Course info
  course: {
    type: Schema.Types.ObjectId,
    ref: "Course"
  },
  courseTitle: {
    type: String
  },

  // Mentor info (after accepted)
  acceptedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  mentorName: {
    type: String
  },

  // Ticket content
  title: {
    type: String,
    required: true
  },
  issue: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["Open", "Accepted", "Resolved", "Closed"],
    default: "Open"
  },

  // Response
  responseMessage: String,
  notes: String,
  meetingLink: String,
  meetingTime: Date,
  expiresAt: Date
}, { timestamps: true });

queryTicketSchema.methods.isMeetingLive = function () {
  if (!this.meetingTime || !this.expiresAt) return false;
  const now = new Date();
  return now >= this.meetingTime && now <= this.expiresAt;
};

module.exports = model("QueryTicket", queryTicketSchema);
