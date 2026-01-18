const express = require("express");
const router = express.Router();

const {
  createProject,
  getMyProjects,
  getProjectById,
  openProjectInRoom,

  // 🔑 FILE OPERATIONS (NEW)
  createFile,
  renameFile,
  deleteFile,
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
 * Open existing collaborative project
 */
router.post(
  "/:projectId/open",
  authMiddleware,
  openProjectInRoom
);

/* =====================================================
   FILE / FOLDER OPERATIONS (COLLABORATIVE)
   ===================================================== */

/**
 * POST /projects/:projectId/files
 * Create file or folder
 * body: { path, content? }
 */
router.post(
  "/:projectId/files",
  authMiddleware,
  createFile
);

/**
 * PUT /projects/:projectId/files/rename
 * Rename file or folder
 * body: { oldPath, newPath }
 */
router.put(
  "/:projectId/files/rename",
  authMiddleware,
  renameFile
);

/**
 * DELETE /projects/:projectId/files
 * Delete file or folder
 * body: { path }
 */
router.delete(
  "/:projectId/files",
  authMiddleware,
  deleteFile
);

/**
 * GET /projects/:id
 * Load project by ID
 */
router.get("/:id", authMiddleware, getProjectById);

module.exports = router;
