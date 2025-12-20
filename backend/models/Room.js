const mongoose = require("mongoose");

const ParticipantSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    username: { type: String, default: "Unknown" },
    socketId: { type: String, default: null },
    online: { type: Boolean, default: false },
    lastActive: { type: Date, default: Date.now },
  },
  { _id: false }
);

const RoomSchema = new mongoose.Schema({
  name: { type: String, default: "Untitled Room" },
  hostUserId: { type: String, required: true },

  inviteCode: { type: String, index: true, sparse: true },
  inviteExpiresAt: { type: Date, default: null },

  /* =========================
     COLLABORATION STATE
     ========================= */

  // Whether the collaborative session has started
  sessionStarted: { type: Boolean, default: false },

  // 🔑 Active collaborative project (NULL until created/opened)
  activeProjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    default: null,
  },

  participants: { type: [ParticipantSchema], default: [] },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

RoomSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("Room", RoomSchema);
