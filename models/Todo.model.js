const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
  completed: { type: Boolean, default: false },
  date: { type: String, required: true },
});

module.exports = mongoose.model("Todo", todoSchema);
