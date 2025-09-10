// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const executeRoutes = require("./routes/execute"); // <-- NEW

const User = require("./models/User");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/execute", executeRoutes); // <-- NEW

// --- Cleanup Logic ---
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour in ms

// Schema to store last cleanup timestamp
const CleanupSchema = new mongoose.Schema({
  job: { type: String, unique: true },
  lastRun: { type: Date, required: true },
});
const CleanupTracker = mongoose.model("CleanupTracker", CleanupSchema);

async function cleanupUnverifiedUsers() {
  try {
    const cutoff = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
    const result = await User.deleteMany({
      isVerified: false,
      createdAt: { $lt: cutoff },
    });

    if (result.deletedCount > 0) {
      console.log(`Cleaned up ${result.deletedCount} unverified accounts`);
    }

    // update last run
    await CleanupTracker.updateOne(
      { job: "unverifiedCleanup" },
      { lastRun: new Date() },
      { upsert: true }
    );
  } catch (err) {
    console.error("Error cleaning up unverified users:", err);
  }
}

async function startCleanupScheduler() {
  // find last cleanup timestamp
  let tracker = await CleanupTracker.findOne({ job: "unverifiedCleanup" });

  if (!tracker) {
    // never ran before
    tracker = await CleanupTracker.create({
      job: "unverifiedCleanup",
      lastRun: new Date(),
    });
  }

  const elapsed = Date.now() - tracker.lastRun.getTime();
  const remaining = CLEANUP_INTERVAL - (elapsed % CLEANUP_INTERVAL);

  console.log(
    `Last cleanup was ${Math.floor(elapsed / 1000)}s ago. Next cleanup in ${
      remaining / 1000
    }s`
  );

  // schedule first run based on remaining time
  setTimeout(function runAndSchedule() {
    cleanupUnverifiedUsers();
    setInterval(cleanupUnverifiedUsers, CLEANUP_INTERVAL);
  }, remaining);
}

// Connect to MongoDB and Start Server
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("MongoDB Connected");

    // Start cleanup scheduler
    await startCleanupScheduler();

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error(err));
