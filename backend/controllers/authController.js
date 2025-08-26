// controllers/AuthController.js
const AuthService = require("../services/AuthService");
const TokenManager = require("../utils/TokenManager");

class AuthController {
  async signup(req, res) {
    try {
      const { username, email, password } = req.body;
      const user = await AuthService.registerUser(username, email, password);
      const token = TokenManager.generateToken(user._id);

      res.status(201).json({
        message: "User registered successfully",
        user: { id: user._id, username: user.username, email: user.email },
        token,
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const user = await AuthService.loginUser(email, password);
      const token = TokenManager.generateToken(user._id);

      res.json({
        message: "Login successful",
        user: { id: user._id, username: user.username, email: user.email },
        token,
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
}

module.exports = new AuthController();
