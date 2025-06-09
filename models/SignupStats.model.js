const { Schema, model } = require("mongoose");

const SignupStatsSchema = new Schema({
  month: { type: String, required: true, unique: true }, 
  count: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = model("SignupStats", SignupStatsSchema);
