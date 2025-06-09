const SignupStats = require("../models/SignupStats.model");

async function canSignupThisMonth(limit = 100) {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const result = await SignupStats.findOneAndUpdate(
    { month: monthKey },
    { $inc: { count: 1 } },
    { upsert: true, new: true }
  );

  if (result.count > limit) {
    // rollback increment if over limit
    await SignupStats.updateOne(
      { month: monthKey },
      { $inc: { count: -1 } }
    );
    return { allowed: false, remaining: 0 };
  }

  const remaining = limit - result.count;

  return {
    allowed: true,
    remaining: remaining >= 0 ? remaining : 0,
  };
}

module.exports = { canSignupThisMonth };

