// =============================================================
// Combined Server: ColorRush + Rankly
// =============================================================

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const PORT = process.env.PORT || 3001;

const app = express();
app.use(express.json());

// Serve ColorRush files
app.use('/colorrush', express.static(path.join(__dirname, 'game-colorrush/public')));
app.get('/colorrush', (req, res) => {
  res.sendFile(path.join(__dirname, 'game-colorrush/public', 'index.html'));
});

// Serve Rankly files  
app.use('/rankly', express.static(path.join(__dirname, 'game-rankly/public')));
app.get('/rankly', (req, res) => {
  res.sendFile(path.join(__dirname, 'game-rankly/public', 'index.html'));
});

// Serve data folder for Rankly
app.use('/data', express.static(path.join(__dirname, 'data')));

const server = http.createServer(app);
const io = new Server(server);

// =============================================================
// COLORRUSH GAME LOGIC (Namespace: /colorrush)
// =============================================================
const colorRushNamespace = io.of('/colorrush');

// Load ColorRush server logic
const { rooms: colorRushRooms, createRoom, getRoom, removeRoom } = require("./rooms");
// Import the full ColorRush server logic here
// For now, basic connection handling
colorRushNamespace.on('connection', (socket) => {
  console.log('[ColorRush] Player connected:', socket.id);
  
  // TODO: Add full ColorRush socket handlers
  // Copy from game-colorrush/server.js
  
  socket.on('disconnect', () => {
    console.log('[ColorRush] Player disconnected:', socket.id);
  });
});

// =============================================================
// RANKLY GAME LOGIC (Namespace: /rankly)  
// =============================================================
const ranklyNamespace = io.of('/rankly');

ranklyNamespace.on('connection', (socket) => {
  console.log('[Rankly] Player connected:', socket.id);
  
  // TODO: Add full Rankly socket handlers
  // Copy from game-rankly/server/index.js
  
  socket.on('disconnect', () => {
    console.log('[Rankly] Player disconnected:', socket.id);
  });
});

// =============================================================
// START SERVER
// =============================================================
server.listen(PORT, () => {
  console.log(`
========================================
🎮 Gamevrse Server 2
========================================
Server running at http://localhost:${PORT}
Games Available:
  - ColorRush (/colorrush)
  - Rankly (/rankly)
========================================
  `);
});
