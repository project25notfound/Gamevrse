// =============================================================
// server.js — Entry Point (redirects to modular server)
// =============================================================

// This file serves as the main entry point for the application.
// It simply imports and runs the modular server from server/index.js

import "./server/index.js";

// That's it! All the actual server logic is in the /server directory:
// - server/index.js - Main server setup and Socket.IO events
// - server/config.js - Configuration constants
// - server/gameEngine.js - Game state machine and round handling
// - server/rankingService.js - Ranking logic and points calculation
// - server/roomManager.js - Room lifecycle management
// - server/reconnectService.js - Disconnect/reconnect handling
// - server/questionService.js - Question loading and validation
// - server/countdownService.js - Start countdown logic
// - server/adminRoutes.js - Admin API endpoints
// - server/utils.js - Utility functions

console.log("[server.js] Loaded modular server from server/index.js");
