// Homepage server - Links to all games
const express = require("express");
const path = require("path");

const PORT = process.env.PORT || 3000;

const app = express();

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "public")));

// Root route serves the homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`
========================================
🎮 Gamevrse Homepage
========================================
Server running at http://localhost:${PORT}
========================================
  `);
});
