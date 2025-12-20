const Project = require("../models/Project");

/**
 * POST /projects
 * Create a new collaborative project
 */
exports.createProject = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Project name is required" });
    }

    // req.user is set by authMiddleware
    const ownerUserId = req.user.id || req.user._id;

    const project = await Project.create({
      name,
      ownerUserId,
      files: [], // start empty
    });

    res.status(201).json({
      project: {
        _id: project._id,
        name: project.name,
        files: project.files,
      },
    });
  } catch (err) {
    console.error("Create project error:", err);
    res.status(500).json({ error: "Failed to create project" });
  }
};
