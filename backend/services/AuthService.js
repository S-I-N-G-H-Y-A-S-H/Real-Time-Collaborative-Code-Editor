// services/AuthService.js
const User = require("../models/User");
const bcrypt = require("bcryptjs");

class AuthService {
  // --- Register new user ---
  async registerUser(username, email, password) {
    const existing = await User.findOne({ email });
    if (existing) throw new Error("User already exists");

    const user = new User({ username, email, password });
    await user.save();
    return user;
  }

  // --- Verify user email ---
  async verifyUser(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    user.isVerified = true;
    await user.save();
    return user;
  }

  // --- Login user ---
  async loginUser(email, password) {
    const user = await User.findOne({ email });
    if (!user) throw new Error("Invalid credentials");

    // ✅ Compare entered password with hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("Invalid credentials");

    return user;
  }
}

module.exports = new AuthService();
