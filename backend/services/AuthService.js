// services/AuthService.js
const User = require("../models/User");

class AuthService {
  async registerUser(username, email, password) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("User already exists");
    }

    const user = new User({ username, email, password });
    await user.save();

    return user;
  }

  async loginUser(email, password) {
    const user = await User.findOne({ email });
    if (!user) throw new Error("User not found");

    const isMatch = await user.matchPassword(password);
    if (!isMatch) throw new Error("Invalid credentials");

    return user;
  }
}

module.exports = new AuthService();
