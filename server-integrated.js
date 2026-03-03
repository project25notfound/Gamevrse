// =============================================================
// Integrated Server - ColorRush + Rankly on Same Port
// =============================================================

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const server = http.createServer(app);
const io = new Server(server);

// =============================================================
// COLORRUSH GAME LOGIC (Namespace: /colorrush)
// =============================================================
const colorRushNamespace = io.of('/colorrush');
const colorRushServer = require('./server-colorrush')(colorRushNamespace);

// =============================================================
// RANKLY GAME LOGIC (Namespace: /rankly)
// =============================================================
const ranklyNamespace = io.of('/rankly');
// We'll need to adapt the Rankly server to work with namespaces
// For now, let's create a placeholder

ranklyNamespace.on('connection', (socket) => {
  console.log('[Rankly] Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('[Rankly] Client disconnected:', socket.id);
  });
  
  // TODO: Import and integrate Rankly game logic here
  // This will require converting the ES modules to CommonJS
  // or using dynamic imports
});

// =============================================================
// START SERVER
// =============================================================
server.listen(PORT, () => {
  console.log(`
========================================
🎮 Gamevrse Multi-Game Server
========================================
Server running at http://localhost:${PORT}
Port: ${PORT}
Games Available:
  - ColorRush (Socket.IO namespace: /colorrush)
  - Rankly (Socket.IO namespace: /rankly)
========================================
  `);
});
