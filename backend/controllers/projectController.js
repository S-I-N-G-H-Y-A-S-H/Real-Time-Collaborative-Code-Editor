const Project = require("../models/Project");
const Room = require("../models/Room");


/* =========================
   SOCKET SERVER CONFIG
   ========================= */
const SOCKET_SERVER_URL =
  process.env.SOCKET_SERVER_URL || "http://localhost:5001";

/* =========================================================
   PROJECT CREATION
   ========================================================= */

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

        // 🔔 Project activation stays on main server socket
        const io = req.app.get("io");
        if (io) {
          io.to(String(room._id)).emit("project:activated", {
            projectId: String(project._id),
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

/* =========================================================
   PROJECT QUERIES
   ========================================================= */

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

exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json({
      project: {
        _id: project._id,
        name: project.name,
        files: project.files || [],
      },
    });
  } catch (err) {
    console.error("Get project error:", err);
    res.status(500).json({ error: "Failed to load project" });
  }
};

/* =========================================================
   OPEN PROJECT IN ROOM
   ========================================================= */

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
      io.to(String(room._id)).emit("project:activated", {
        projectId: String(project._id),
      });
    }

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

/* =========================================================
   FILE OPERATIONS (REST → SOCKET SERVER)
   ========================================================= */

async function notifySocketServer(roomId, projectId, files) {
  try {
    await fetch(`${SOCKET_SERVER_URL}/internal/files-updated`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId,
        projectId,
        files,
      }),
    });
  } catch (err) {
    console.error("SocketServer notify failed:", err.message);
  }
}

/**
 * CREATE FILE
 */
exports.createFile = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { path, content = "", roomId } = req.body;

    if (!path || !roomId) {
      return res.status(400).json({ error: "path and roomId required" });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });

    if (project.files.some((f) => f.path === path)) {
      return res.status(409).json({ error: "File already exists" });
    }

    project.files.push({
      path,
      content,
      lastEditedBy: req.user.id,
      updatedAt: new Date(),
    });

    await project.save();

    await notifySocketServer(roomId, projectId, project.files);

    res.json({ success: true, files: project.files });
  } catch (err) {
    console.error("Create file error:", err);
    res.status(500).json({ error: "Failed to create file" });
  }
};

/**
 * RENAME FILE
 */
exports.renameFile = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { oldPath, newPath, roomId } = req.body;

    if (!oldPath || !newPath || !roomId) {
      return res.status(400).json({
        error: "oldPath, newPath and roomId required",
      });
    }

    const normalize = (p = "") =>
      p.replace(/^\/+/, "").replace(/^\.\/+/, "");

    const oldNorm = normalize(oldPath);
    const newNorm = normalize(newPath);

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const index = project.files.findIndex(
      (f) => normalize(f.path) === oldNorm
    );

    if (index === -1) {
      return res.status(404).json({ error: "File not found" });
    }

    project.files[index] = {
      ...project.files[index].toObject(),
      path: newNorm,
      updatedAt: new Date(),
      lastEditedBy: req.user.id,
    };

    await project.save();

    await notifySocketServer(roomId, projectId, project.files);

    res.json({ success: true, files: project.files });
  } catch (err) {
    console.error("Rename error:", err);
    res.status(500).json({ error: "Failed to rename" });
  }
};

/**
 * DELETE FILE / FOLDER
 */
exports.deleteFile = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { path, roomId } = req.body;

    if (!path || !roomId) {
      return res.status(400).json({ error: "path and roomId required" });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });

    project.files = project.files.filter(
      (f) => f.path !== path && !f.path.startsWith(path + "/")
    );

    await project.save();

    await notifySocketServer(roomId, projectId, project.files);

    res.json({ success: true, files: project.files });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete" });
  }
};
