// =============================================================
// Combined Server: Homepage + Blackjack Game
// =============================================================

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());

// Serve homepage static files
app.use(express.static(path.join(__dirname, "public")));

// Serve Blackjack game files at /blackjack route
app.use('/blackjack', express.static(path.join(__dirname, 'game-blackjack/public')));

// Homepage route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Blackjack game route
app.get('/blackjack', (req, res) => {
  res.sendFile(path.join(__dirname, 'game-blackjack/public', 'index.html'));
});

const server = http.createServer(app);
const io = new Server(server);

// =============================================================
// IMPORT BLACKJACK GAME LOGIC
// =============================================================

// Import the complete Blackjack server logic
// We'll need to copy the socket handlers from game-blackjack/server.js
const crypto = require('crypto');

const READY_COUNTDOWN_MS = 60000;
const ACTION_COOLDOWN_MS = 400;
const TURN_MS = 15000;
const TURN_EMIT_BUFFER_MS = 50;
const ELIM_THRESHOLD = 2;
const RECONNECT_WINDOW_MS = 60 * 1000;
const RETURN_TO_LOBBY_SECONDS = 10;
const NEXT_ROUND_COUNTDOWN_MS = 10000;
const ROULETTE_CHOICE_TIMEOUT_MS = 30000;

const rooms = {};
const playersByToken = {};
const bots = new Map();
let botIdCounter = 0;

// Copy all the Blackjack game functions here
// For now, let's just import the entire server logic by requiring it
// But we need to modify it to work with our io instance

// =============================================================
// TEMPORARY: Use the actual Blackjack server
// =============================================================
// Since the Blackjack server is complex, let's just use it directly
// by requiring and running it with our server instance

console.log('[Server] Loading Blackjack game logic...');

// Import Blackjack server logic (we'll need to modify game-blackjack/server.js to export its logic)
// For now, we'll run both servers separately

// =============================================================
// START SERVER
// =============================================================
server.listen(PORT, () => {
  console.log(`
========================================
🎮 Gamevrse Server 1
========================================
Server running at http://localhost:${PORT}
Routes:
  - Homepage: http://localhost:${PORT}/
  - Blackjack: http://localhost:${PORT}/blackjack
========================================
NOTE: Blackjack game logic needs to be integrated.
For now, please run: node game-blackjack/server.js separately on port 3002
========================================
  `);
});
