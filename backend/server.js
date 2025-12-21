// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const executeRoutes = require("./routes/execute");
const projectsRoutes = require("./routes/projects");
const roomsRoutes = require("./routes/rooms");

const User = require("./models/User");

const app = express();
const server = http.createServer(app);

/* =========================
   SOCKET.IO SETUP (CRITICAL)
   ========================= */
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// 🔑 Make io available everywhere (controllers, routes)
app.set("io", io);

/* =========================
   SOCKET EVENTS
   ========================= */
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join-room", ({ roomId }) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on("sync-view", ({ roomId, page }) => {
    socket.to(roomId).emit("view-synced", { page });
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

/* =========================
   MIDDLEWARE
   ========================= */
app.use(cors());
app.use(bodyParser.json());

/* =========================
   ROUTES
   ========================= */
app.use("/api/auth", authRoutes);
app.use("/api/execute", executeRoutes);
app.use("/projects", projectsRoutes);
app.use("/rooms", roomsRoutes);

/* =========================
   CLEANUP LOGIC (UNCHANGED)
   ========================= */
const CLEANUP_INTERVAL = 60 * 60 * 1000;

const CleanupSchema = new mongoose.Schema({
  job: { type: String, unique: true },
  lastRun: { type: Date, required: true },
});
const CleanupTracker = mongoose.model("CleanupTracker", CleanupSchema);

async function cleanupUnverifiedUsers() {
  try {
    const cutoff = new Date(Date.now() - 60 * 60 * 1000);
    const result = await User.deleteMany({
      isVerified: false,
      createdAt: { $lt: cutoff },
    });

    if (result.deletedCount > 0) {
      console.log(`Cleaned up ${result.deletedCount} unverified accounts`);
    }

    await CleanupTracker.updateOne(
      { job: "unverifiedCleanup" },
      { lastRun: new Date() },
      { upsert: true }
    );
  } catch (err) {
    console.error("Cleanup error:", err);
  }
}

async function startCleanupScheduler() {
  let tracker = await CleanupTracker.findOne({ job: "unverifiedCleanup" });

  if (!tracker) {
    tracker = await CleanupTracker.create({
      job: "unverifiedCleanup",
      lastRun: new Date(),
    });
  }

  const elapsed = Date.now() - tracker.lastRun.getTime();
  const remaining = CLEANUP_INTERVAL - (elapsed % CLEANUP_INTERVAL);

  setTimeout(() => {
    cleanupUnverifiedUsers();
    setInterval(cleanupUnverifiedUsers, CLEANUP_INTERVAL);
  }, remaining);
}

/* =========================
   START SERVER
   ========================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB Connected");
    await startCleanupScheduler();

    server.listen(process.env.PORT || 5000, () => {
      console.log("Server running with Socket.IO");
    });
  })
  .catch(console.error);
