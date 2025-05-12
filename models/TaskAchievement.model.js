const { Schema, model } = require("mongoose");

const taskAchievementSchema = new Schema({
    title: { type: String, required: true },
    description: String,
    badge: {
      type: String,
      enum: ["gold", "silver", "bronze"],
      required: true
    },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String, required: true }, 
    assignedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedByUsername: { type: String, required: true }, 
    assignedAt: { type: Date, default: Date.now }
  }, { timestamps: true });
  
  module.exports = model("TaskAchievement", taskAchievementSchema);
  