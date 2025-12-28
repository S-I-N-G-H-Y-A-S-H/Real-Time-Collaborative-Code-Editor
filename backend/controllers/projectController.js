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

    const project = await Project.create({
      name,
      ownerUserId,
      files: [],
    });

    if (roomId) {
      const room = await Room.findById(roomId);

      if (room) {
        room.activeProjectId = project._id;
        room.sessionStarted = true;
        room.currentView = "editor";
        await room.save();

        const io = req.app.get("io");
        if (io) {
          io.to(room._id.toString()).emit("project:activated", {
            projectId: project._id.toString(),
          });
        }
      }
    }

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
 * GET /projects/my
 * List projects owned by logged-in user
 */
exports.getMyProjects = async (req, res) => {
  try {
    const ownerUserId = req.user.id || req.user._id;

    const projects = await Project.find({ ownerUserId })
      .sort({ updatedAt: -1 })
      .select("_id name updatedAt");

    res.json({
      success: true,
      projects: projects.map((p) => ({
        id: p._id,
        name: p.name,
        updatedAt: p.updatedAt,
      })),
    });
  } catch (err) {
    console.error("Get my projects error:", err);
    res.status(500).json({ error: "Failed to load projects" });
  }
};

/**
 * GET /projects/:id
 * Load project by ID
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

/**
 * POST /projects/:projectId/open
 * Open existing project in a room
 */
exports.openProjectInRoom = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { roomId } = req.body;

    if (!roomId) {
      return res.status(400).json({ error: "roomId is required" });
    }

    const userId = req.user.id || req.user._id;

    const [project, room] = await Promise.all([
      Project.findById(projectId),
      Room.findById(roomId),
    ]);

    if (!project) return res.status(404).json({ error: "Project not found" });
    if (!room) return res.status(404).json({ error: "Room not found" });

    if (String(project.ownerUserId) !== String(userId)) {
      return res.status(403).json({ error: "Not your project" });
    }

    room.activeProjectId = project._id;
    room.sessionStarted = true;
    room.currentView = "editor";
    await room.save();

    const io = req.app.get("io");
    if (io) {
      io.to(room._id.toString()).emit("project:activated", {
        projectId: project._id.toString(),
      });
    }

    console.log(
      `📂 Project OPENED | project=${project._id} | room=${room._id}`
    );

    res.json({
      success: true,
      room: {
        roomId: room._id,
        activeProjectId: project._id,
        currentView: room.currentView,
      },
    });
  } catch (err) {
    console.error("Open project error:", err);
    res.status(500).json({ error: "Failed to open project" });
  }
};
