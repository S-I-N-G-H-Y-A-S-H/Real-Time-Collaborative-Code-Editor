// backend/routes/rooms.js
const express = require("express");
const crypto = require("crypto");
const router = express.Router();

const Room = require("../models/Room");
const authMiddleware = require("../middleware/authMiddleware");

/* =========================
   HELPERS
   ========================= */

function generateInviteCode(len = 7) {
  return crypto
    .randomBytes(Math.ceil(len * 0.75))
    .toString("base64")
    .replace(/\W/g, "")
    .slice(0, len)
    .toUpperCase();
}

/* =========================
   CREATE ROOM
   POST /rooms
   ========================= */

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;

    const room = new Room({
      name: name || "Untitled Room",
      hostUserId: req.user.id,
      participants: [
        {
          userId: req.user.id,
          username: req.user.username,
          online: false,
        },
      ],
    });

    await room.save();

    res.json({
      success: true,
      roomId: room._id,
      room,
    });
  } catch (err) {
    console.error("POST /rooms error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* =========================
   CREATE / FETCH INVITE
   POST /rooms/:id/invite
   ========================= */

router.post("/:id/invite", authMiddleware, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ error: "Room not found" });

    if (room.hostUserId !== req.user.id) {
      return res.status(403).json({ error: "Only host can generate invite" });
    }

    if (!room.inviteCode) {
      room.inviteCode = generateInviteCode();
      await room.save();
    }

    const origin =
      process.env.CLIENT_ORIGIN || "http://localhost:5173";

    res.json({
      success: true,
      inviteCode: room.inviteCode,
      link: `${origin}/editor?invite=${room.inviteCode}`,
      inviteExpiresAt: room.inviteExpiresAt,
    });
  } catch (err) {
    console.error("POST /rooms/:id/invite error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* =========================
   JOIN ROOM
   POST /rooms/join
   ========================= */

router.post("/join", authMiddleware, async (req, res) => {
  try {
    const { inviteCode, roomId } = req.body;

    let room;
    if (inviteCode) {
      room = await Room.findOne({ inviteCode });
    } else if (roomId) {
      room = await Room.findById(roomId);
    } else {
      return res
        .status(400)
        .json({ error: "inviteCode or roomId required" });
    }

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    if (
      room.inviteExpiresAt &&
      room.inviteExpiresAt.getTime() < Date.now()
    ) {
      return res.status(410).json({ error: "Invite expired" });
    }

    const alreadyJoined = room.participants.some(
      (p) => p.userId === req.user.id
    );

    if (!alreadyJoined) {
      room.participants.push({
        userId: req.user.id,
        username: req.user.username,
        online: false,
        lastActive: new Date(),
      });

      await room.save();
    }

    /* 🔑 CRITICAL FIX: SEND VIEW + PROJECT */
    res.json({
      success: true,
      room: {
        roomId: room._id,
        name: room.name,
        hostUserId: room.hostUserId,
        activeProjectId: room.activeProjectId || null,
        currentView: room.currentView || "welcome",
      },
    });
  } catch (err) {
    console.error("POST /rooms/join error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
