// backend/socketServer.js
require("dotenv").config();
const http = require("http");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const Room = require("./models/Room");
const User = require("./models/User"); // ✅ ADD USER MODEL
const TokenManager = require("./utils/TokenManager");

const PORT = process.env.PORT_SOCKET || 5001;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("FATAL: MONGO_URI is not set");
  process.exit(1);
}

const httpServer = http.createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

/* =========================
   HELPERS
   ========================= */

async function broadcastParticipants(roomId) {
  const room = await Room.findById(roomId).lean();
  if (!room) return;

  const participants = (room.participants || []).map((p) => ({
    userId: p.userId,
    username: p.username, // ✅ now always real
    online: !!p.online,
    socketId: p.socketId || null,
    isHost: String(p.userId) === String(room.hostUserId),
    lastActive: p.lastActive || null,
  }));

  io.to(String(roomId)).emit("participants-updated", {
    roomId: String(room._id),
    hostUserId: room.hostUserId,
    participants,
  });
}

function verifyTokenSafe(token) {
  try {
    if (!token) return null;
    return TokenManager.verifyToken(token);
  } catch {
    return null;
  }
}

/* =========================
   SOCKET
   ========================= */

io.on("connection", (socket) => {
  console.log("🔌 socket connected:", socket.id);

  /* ---------- AUTH + JOIN ---------- */
  socket.on("auth-join", async ({ token, roomId }) => {
    try {
      const userId = verifyTokenSafe(token);
      if (!userId) {
        socket.emit("auth-error", { message: "Invalid token" });
        socket.disconnect(true);
        return;
      }

      if (!roomId) {
        socket.emit("join-error", { message: "Missing roomId" });
        return;
      }

      const [room, user] = await Promise.all([
        Room.findById(roomId),
        User.findById(userId).lean(), // ✅ FETCH USER
      ]);

      if (!room) {
        socket.emit("join-error", { message: "Room not found" });
        return;
      }

      if (!user) {
        socket.emit("join-error", { message: "User not found" });
        return;
      }

      const uid = String(userId);
      const username =
        user.username || user.name || user.email || "User";

      // Ensure single active socket per user
      room.participants.forEach((p) => {
        if (p.userId === uid && p.socketId && p.socketId !== socket.id) {
          p.socketId = null;
          p.online = false;
        }
      });

      let participant = room.participants.find((p) => p.userId === uid);

      if (!participant) {
        participant = {
          userId: uid,
          username, // ✅ REAL NAME
          socketId: socket.id,
          online: true,
          lastActive: new Date(),
        };
        room.participants.push(participant);
      } else {
        participant.socketId = socket.id;
        participant.online = true;
        participant.lastActive = new Date();
        participant.username = username; // ✅ ALWAYS UPDATE
      }

      // Default view
      if (!room.currentView) {
        room.currentView = "welcome";
      }

      await room.save();

      socket.data.userId = uid;
      socket.data.roomId = String(room._id);

      socket.join(String(room._id));

      socket.emit("join-success", {
        roomId: String(room._id),
        hostUserId: room.hostUserId,
      });

      await broadcastParticipants(room._id);

      // Sync current view for late joiners
      socket.emit("view-synced", {
        roomId: String(room._id),
        page: room.currentView,
      });

      console.log(`✅ user ${username} (${uid}) joined room ${room._id}`);
    } catch (err) {
      console.error("auth-join error:", err);
      socket.emit("join-error", { message: "Server error during join" });
    }
  });

  /* ---------- VIEW SYNC ---------- */
  socket.on("sync-view", async ({ roomId, page }) => {
    try {
      const { userId } = socket.data || {};
      if (!userId || !roomId || !page) return;

      const room = await Room.findById(roomId);
      if (!room) return;

      if (String(room.hostUserId) !== String(userId)) return;

      room.currentView = page;
      await room.save();

      io.to(String(roomId)).emit("view-synced", {
        roomId: String(roomId),
        page,
      });

      console.log(`🧭 View synced to "${page}" for room ${roomId}`);
    } catch (err) {
      console.error("sync-view error:", err);
    }
  });

  /* ---------- LEAVE / DISCONNECT ---------- */
  socket.on("leave-room", async () => {
    await handleDisconnect(socket);
  });

  socket.on("disconnect", async (reason) => {
    console.log(`❌ socket disconnected ${socket.id} (${reason})`);
    await handleDisconnect(socket);
  });
});

/* =========================
   DISCONNECT HANDLER
   ========================= */

async function handleDisconnect(socket) {
  const { userId, roomId } = socket.data || {};
  if (!userId || !roomId) return;

  const room = await Room.findById(roomId);
  if (!room) return;

  const participant = room.participants.find(
    (p) => p.userId === userId && p.socketId === socket.id
  );

  if (participant) {
    participant.socketId = null;
    participant.online = false;
    participant.lastActive = new Date();
    await room.save();
    await broadcastParticipants(roomId);
  }

  socket.leave(String(roomId));
}

/* =========================
   START SERVER
   ========================= */

async function connectWithRetry(uri, maxRetries = 20) {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      await mongoose.connect(uri);
      console.log("✅ SocketServer connected to MongoDB");
      httpServer.listen(PORT, () => {
        console.log(`🚀 SocketServer listening on ${PORT}`);
      });
      return;
    } catch (err) {
      attempt++;
      const delay = 1000 * attempt;
      console.error(`Mongo retry ${attempt}/${maxRetries}`, err.message);
      await new Promise((res) => setTimeout(res, delay));
    }
  }

  console.error("❌ Could not connect to MongoDB. Exiting.");
  process.exit(1);
}

connectWithRetry(MONGO_URI);
