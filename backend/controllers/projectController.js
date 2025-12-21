const Project = require("../models/Project");
const Room = require("../models/Room");

/**
 * POST /projects
 * Create a new collaborative project
 */
exports.createProject = async (req, res) => {
  try {
    const { name, roomId } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Project name is required" });
    }

    const ownerUserId = req.user.id || req.user._id;

    // 1️⃣ Create project
    const project = await Project.create({
      name,
      ownerUserId,
      files: [],
    });

    // 2️⃣ Link project to room
    if (roomId) {
      const room = await Room.findById(roomId);
      if (room) {
        room.activeProjectId = project._id;
        room.sessionStarted = true;
        await room.save();
      }
    }

    // 3️⃣ Respond
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

/**
 * ✅ GET /projects/:id
 * Load project for guests
 */
exports.getProjectById = async (req, res) => {
  try {
    const projectId = req.params.id;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json({
      project: {
        _id: project._id,
        name: project.name,
        files: project.files || [],
        tree: project.tree || [],
      },
    });
  } catch (err) {
    console.error("Get project error:", err);
    res.status(500).json({ error: "Failed to load project" });
  }
};
