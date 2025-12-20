const TokenManager = require("../utils/TokenManager");
const User = require("../models/User"); // adjust path if needed

module.exports = async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing auth token" });
    }

    const token = authHeader.slice(7);
    const userId = TokenManager.verifyToken(token);

    // 🔑 Fetch full user from DB
    const user = await User.findById(userId).select("_id username email");

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // ✅ Attach to request
    req.user = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
