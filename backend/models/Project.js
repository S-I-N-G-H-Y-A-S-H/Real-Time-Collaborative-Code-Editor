const mongoose = require("mongoose");

/* =========================
   FILE SCHEMA (EMBEDDED)
   ========================= */

const ProjectFileSchema = new mongoose.Schema(
  {
    // Full path relative to project root
    // Examples:
    // "index.js"
    // "src/app.js"
    // "src/utils/helpers.js"
    path: { type: String, required: true },

    // Entire file content
    content: { type: String, default: "" },

    // Optional metadata (future-proofing)
    language: { type: String, default: "plaintext" },
    lastEditedBy: { type: String, default: null }, // userId
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

/* =========================
   PROJECT SCHEMA
   ========================= */

const ProjectSchema = new mongoose.Schema({
  // Display name shown to user
  name: { type: String, required: true },

  // Creator / owner
  ownerUserId: { type: String, required: true },

  // Embedded files (flat paths)
  files: { type: [ProjectFileSchema], default: [] },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

ProjectSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("Project", ProjectSchema);
