// routes/authRoutes.js
const express = require("express");
const AuthController = require("../controllers/AuthController");

const router = express.Router();

router.post("/signup", (req, res) => AuthController.signup(req, res));
router.post("/login", (req, res) => AuthController.login(req, res));

module.exports = router;
