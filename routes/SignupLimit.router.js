const express = require("express");
const router = express.Router();
const SignupStats = require("../models/SignupStats.model");

const SIGNUP_LIMIT = 100; 

router.get("/", async (req, res) => {
  try {
    const stats = await SignupStats.find().sort({ month: 1 });

    const response = stats.map(stat => {
      const remaining = SIGNUP_LIMIT - stat.count;
      return {
        month: stat.month,
        count: stat.count,
        remaining: remaining >= 0 ? remaining : 0,
      };
    });

    res.json(response);
  } catch (error) {
    console.error("Error fetching signup stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
