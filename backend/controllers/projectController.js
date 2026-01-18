const Project = require("../models/Project");
const Room = require("../models/Room");

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
   FILE OPERATIONS (REST + SOCKET BROADCAST)
   ========================================================= */

/**
 * POST /projects/:projectId/files
 * body: { path, content?, roomId }
 */
exports.createFile = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { path, content = "", roomId } = req.body;

    if (!path || !roomId) {
      return res.status(400).json({ error: "path and roomId required" });
    }

    const [project, room] = await Promise.all([
      Project.findById(projectId),
      Room.findById(roomId),
    ]);

    if (!project) return res.status(404).json({ error: "Project not found" });
    if (!room) return res.status(404).json({ error: "Room not found" });

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

    const io = req.app.get("io");
    if (io) {
      io.to(String(roomId)).emit("files:updated", {
        roomId,
        projectId,
        files: project.files,
      });
    }

    res.json({ success: true, files: project.files });
  } catch (err) {
    console.error("Create file error:", err);
    res.status(500).json({ error: "Failed to create file" });
  }
};

/**
 * PUT /projects/:projectId/files/rename
 * body: { oldPath, newPath, roomId }
 */
exports.renameFile = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { oldPath, newPath, roomId } = req.body;

    if (!oldPath || !newPath || !roomId) {
      return res
        .status(400)
        .json({ error: "oldPath, newPath and roomId required" });
    }

    const [project, room] = await Promise.all([
      Project.findById(projectId),
      Room.findById(roomId),
    ]);

    if (!project) return res.status(404).json({ error: "Project not found" });
    if (!room) return res.status(404).json({ error: "Room not found" });

    project.files.forEach((file) => {
      if (file.path === oldPath) {
        file.path = newPath;
      } else if (file.path.startsWith(oldPath + "/")) {
        file.path = newPath + file.path.slice(oldPath.length);
      }
      file.updatedAt = new Date();
      file.lastEditedBy = req.user.id;
    });

    await project.save();

    const io = req.app.get("io");
    if (io) {
      io.to(String(roomId)).emit("files:updated", {
        roomId,
        projectId,
        files: project.files,
      });
    }

    res.json({ success: true, files: project.files });
  } catch (err) {
    console.error("Rename error:", err);
    res.status(500).json({ error: "Failed to rename" });
  }
};

/**
 * DELETE /projects/:projectId/files
 * body: { path, roomId }
 */
exports.deleteFile = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { path, roomId } = req.body;

    if (!path || !roomId) {
      return res.status(400).json({ error: "path and roomId required" });
    }

    const [project, room] = await Promise.all([
      Project.findById(projectId),
      Room.findById(roomId),
    ]);

    if (!project) return res.status(404).json({ error: "Project not found" });
    if (!room) return res.status(404).json({ error: "Room not found" });

    project.files = project.files.filter(
      (f) => f.path !== path && !f.path.startsWith(path + "/")
    );

    await project.save();

    const io = req.app.get("io");
    if (io) {
      io.to(String(roomId)).emit("files:updated", {
        roomId,
        projectId,
        files: project.files,
      });
    }

    res.json({ success: true, files: project.files });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete" });
  }
};
