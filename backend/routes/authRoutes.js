// routes/authRoutes.js
const express = require("express");
const AuthController = require("../controllers/AuthController");

const router = express.Router();

// Signup (sends verification email)
router.post("/signup", (req, res) => AuthController.signup(req, res));

// Login
router.post("/login", (req, res) => AuthController.login(req, res));

// Verify Email (when user clicks the link from Gmail)
router.get("/verify-email", (req, res) => AuthController.verifyEmail(req, res));

// Forgot Password (send OTP)
router.post("/forgot-password", (req, res) => AuthController.forgotPassword(req, res));

// Reset Password (validate OTP + set new password)
router.post("/reset-password", (req, res) => AuthController.resetPassword(req, res));

module.exports = router;
