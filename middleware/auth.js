const jwt = require("jsonwebtoken");
const User = require("../models/User.model");

const authenticate = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isApproved || user.token !== token) {
      return res.status(403).json({ error: "Session expired or unauthorized" });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(400).json({ error: "Invalid token" });
  }
};

module.exports = authenticate;
