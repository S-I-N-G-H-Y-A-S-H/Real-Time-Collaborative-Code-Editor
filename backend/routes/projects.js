const express = require("express");
const router = express.Router();

const {
  createProject,
  getProjectById, // ✅ NEW
} = require("../controllers/projectController");

const authMiddleware = require("../middleware/authMiddleware");

/**
 * POST /projects
 * Create project
 */
router.post("/", authMiddleware, createProject);

/**
 * GET /projects/:id
 * Load project (used by guests)
 */
router.get("/:id", authMiddleware, getProjectById); // ✅ NEW

module.exports = router;
