const express = require("express");
const router = express.Router();

const {
  createProject,
  getMyProjects,
  getProjectById,
  openProjectInRoom,
} = require("../controllers/projectController");

const authMiddleware = require("../middleware/authMiddleware");

/**
 * POST /projects
 * Create project
 */
router.post("/", authMiddleware, createProject);

/**
 * GET /projects/my
 * MUST be before /:id
 */
router.get("/my", authMiddleware, getMyProjects);

/**
 * POST /projects/:projectId/open
 */
router.post(
  "/:projectId/open",
  authMiddleware,
  openProjectInRoom
);

/**
 * GET /projects/:id
 */
router.get("/:id", authMiddleware, getProjectById);

module.exports = router;
