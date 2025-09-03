// utils/TokenManager.js
const jwt = require("jsonwebtoken");

class TokenManager {
  generateToken(userId, expiresIn = "7d") {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn });
  }

  verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET).id;
  }
}

module.exports = new TokenManager();
