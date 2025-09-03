// controllers/AuthController.js
const AuthService = require("../services/AuthService");
const TokenManager = require("../utils/TokenManager");
const sendEmail = require("../utils/sendEmail");
const User = require("../models/User");

class AuthController {
  // --- Signup → send verification email ---
  async signup(req, res) {
    try {
      const { username, email, password } = req.body;
      const user = await AuthService.registerUser(username, email, password);

      const verifyToken = TokenManager.generateToken(user._id, "1h");
      const verifyLink = `${process.env.SERVER_URL}/api/auth/verify-email?token=${verifyToken}`;

      await sendEmail({
        to: email,
        subject: "Verify your email - CodeSync",
        html: `
          <h2>Hello ${username},</h2>
          <p>Please verify your email by clicking the link below:</p>
          <a href="${verifyLink}">${verifyLink}</a>
          <p>This link expires in 1 hour.</p>
        `,
      });

      res.status(201).json({
        message: "User registered. Please check your email to verify account.",
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  // --- Verify Email ---
  async verifyEmail(req, res) {
    try {
      const { token } = req.query;
      const userId = TokenManager.verifyToken(token);

      await AuthService.verifyUser(userId);

      res.redirect(`${process.env.CLIENT_ORIGIN}/welcome`);
    } catch (err) {
      res.status(400).json({ error: "Invalid or expired verification link." });
    }
  }

  // --- Login ---
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const user = await AuthService.loginUser(email, password);

      if (!user.isVerified) {
        return res
          .status(403)
          .json({ error: "Please verify your email before logging in." });
      }

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

  // --- Forgot Password (Send OTP) ---
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ error: "User not found" });

      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      user.resetPasswordOTP = otp;
      user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
      await user.save();

      await sendEmail({
        to: email,
        subject: "Password Reset OTP - CodeSync",
        html: `
          <h2>Hello ${user.username},</h2>
          <p>Your OTP to reset password is: <b>${otp}</b></p>
          <p>This OTP will expire in 10 minutes.</p>
        `,
      });

      res.json({ message: "OTP sent to your email" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error while sending OTP" });
    }
  }

  // --- Reset Password ---
  async resetPassword(req, res) {
    try {
      const { email, otp, newPassword } = req.body;

      const user = await User.findOne({
        email,
        resetPasswordOTP: otp,
        resetPasswordExpires: { $gt: Date.now() }, // not expired
      });

      if (!user) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }

      // ✅ Just set new password (pre-save hook will hash it)
      user.password = newPassword;

      // Clear OTP fields
      user.resetPasswordOTP = undefined;
      user.resetPasswordExpires = undefined;

      await user.save();

      res.json({
        message: "Password reset successful. Please log in with new password.",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error while resetting password" });
    }
  }
}

module.exports = new AuthController();
