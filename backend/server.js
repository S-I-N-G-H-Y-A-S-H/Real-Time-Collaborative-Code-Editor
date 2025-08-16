// server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect DB and start server
(async () => {
  try {
    await connectDB();

    // ⬇️ Add your real routes here (e.g., users, files, auth)
    // app.use("/api/users", require("./routes/userRoutes"));
    // app.use("/api/files", require("./routes/fileRoutes"));

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
