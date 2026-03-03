# ColorRush Architecture Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Patterns](#architecture-patterns)
4. [Core Modules](#core-modules)
5. [State Management](#state-management)
6. [Game Flow](#game-flow)
7. [Socket Communication](#socket-communication)
8. [Data Structures](#data-structures)
9. [Key Algorithms](#key-algorithms)
10. [Security & Validation](#security--validation)

---

## System Overview

ColorRush is a real-time multiplayer memory game built on a client-server architecture using WebSocket communication. The system supports multiple concurrent game rooms with up to 6 players each, featuring dynamic game modes, power-ups, and spectator functionality.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  index.html  │  │  client.js   │  │   modal.js   │      │
│  │   (UI/DOM)   │  │ (Game Logic) │  │ (UI Helpers) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                    Socket.IO Client                          │
└────────────────────────────┬────────────────────────────────┘
                             │ WebSocket
                             │ (Real-time bidirectional)
┌────────────────────────────┴────────────────────────────────┐
│                    Socket.IO Server                          │
│                            │                                 │
│  ┌─────────────────────────┴──────────────────────────┐     │
│  │              Server Layer (Node.js)                 │     │
│  │  ┌──────────────┐           ┌──────────────┐       │     │
│  │  │  server.js   │◄─────────►│   rooms.js   │       │     │
│  │  │ (Game Engine)│           │(Room Manager)│       │     │
│  │  └──────────────┘           └──────────────┘       │     │
│  │         │                           │               │     │
│  │         └───────────────┬───────────┘               │     │
│  │                         │                           │     │
│  │                  In-Memory State                    │     │
│  │              (rooms, players, timers)               │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                               │
│                    Express HTTP Server                        │
│                   (Static file serving)                       │
└───────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Backend
- **Node.js**: JavaScript runtime environment
- **Express 5.1.0**: Web application framework
- **Socket.IO 4.8.1**: Real-time bidirectional event-based communication

### Frontend
- **Vanilla JavaScript**: No framework dependencies
- **HTML5**: Semantic markup with ARIA attributes
- **CSS3**: Modern styling with animations and transitions
- **Socket.IO Client**: WebSocket communication

### Development
- **npm**: Package management
- **No build tools**: Direct file serving for simplicity

---

## Architecture Patterns

### 1. Event-Driven Architecture
The entire system is built on event-driven communication using Socket.IO:
- Client emits events (user actions)
- Server processes events and updates state
- Server broadcasts state changes to relevant clients
- Clients update UI based on received events

### 2. State Machine Pattern
Game phases follow a strict state machine:
```
LOBBY → GET_READY → SEQUENCE → PLAY → ROUND_END → (repeat or end)
                                  ↓
                            SUDDEN_DEATH (1v1 only)
```

### 3. Room-Based Isolation
Each game room is completely isolated:
- Independent state
- Separate player lists
- Isolated timers
- No cross-room interference

### 4. Authoritative Server
All game logic runs server-side:
- Client sends inputs only
- Server validates and processes
- Server is source of truth
- Prevents cheating

### 5. Observer Pattern
State changes broadcast to observers:
- Players in room receive updates
- Spectators receive limited updates
- Host receives additional controls

---

## Core Modules

### server.js (Main Game Engine)
**Responsibilities:**
- Socket.IO server initialization
- Game state management
- Round progression logic
- Player lifecycle management
- Timer management
- Power-up system
- Elimination logic
- Sudden death system
- Score calculation
- Event broadcasting

**Key Functions:**
```javascript
// Game Flow
startNextRound(room)           // Initiates new round
generateSequence(room, length) // Creates color sequence
checkSequence(room, player)    // Validates player input
endRound(room)                 // Processes round results

// Phase Management
transitionToGetReady(room)     // GET_READY phase
transitionToSequence(room)     // SEQUENCE phase
transitionToPlay(room)         // PLAY phase
transitionToRoundEnd(room)     // ROUND_END phase

// Lobby System
canStartGame(room)             // Authoritative gate
tryStartGame(room)             // Smart start logic
startGameCountdown(room)       // 30s countdown
actuallyStartGame(room)        // Game initialization

// Elimination & Victory
eliminatePlayer(room, player)  // Handle elimination
checkAndHandleSinglePlayer()   // Victory check
detectSuddenDeathCondition()   // 1v1 detection
startSuddenDeathRound(room)    // Sudden death logic

// Power-Ups
activateSecondChance()         // Replay sequence
activateFreeze()               // Pause timer
activatePatternPeek()          // Reveal pattern

// Utilities
broadcastRoomState(room)       // Send state to all
updatePlayerList(room)         // Sync player list
clearPhaseTimers(room)         // Cleanup timers
```

### rooms.js (Room Management)
**Responsibilities:**
- Room creation and deletion
- Room code generation
- Room state initialization
- Room lookup and validation

**Key Functions:**
```javascript
createRoom(hostSocketId, options)  // Create new room
getRoom(roomId)                    // Retrieve room
removeRoom(roomId)                 // Delete room
generateRoomCode()                 // 6-char unique code
listRooms()                        // Debug helper
getRoomCount()                     // Debug helper
```

### client.js (Client Game Logic)
**Responsibilities:**
- Socket event handling
- UI state management
- User input processing
- Timer visualization
- Animation control
- Sound playback
- Power-up UI
- Spectator mode

**Key Components:**
```javascript
// Socket Handlers
socket.on('roomState', ...)        // State sync
socket.on('showSequence', ...)     // Sequence display
socket.on('phaseChange', ...)      // Phase transitions
socket.on('playerEliminated', ...) // Elimination UI
socket.on('gameOver', ...)         // End game UI

// UI Controllers
showSequence(colors)               // Animate sequence
handleColorClick(color)            // Player input
updateTimer(remaining)             // Timer display
showPowerUpUI()                    // Power-up buttons
updateScoreboard()                 // Score display

// Game State
let mySequence = []                // Player input
let isMyTurn = false               // Input lock
let currentPhase = null            // Phase tracking
```

### modal.js (UI Helpers)
**Responsibilities:**
- Modal window management
- Form handling
- UI animations
- Accessibility features

---

## State Management

### Room State Structure
```javascript
{
  id: "ABC123",                    // 6-char room code
  hostId: "socket-id",             // Host socket ID
  players: {                       // Player map
    "socket-id": {
      id: "socket-id",
      name: "Player1",
      colorIndex: 0,               // UI color (0-3)
      alive: true,
      lives: 2,
      score: 0,
      isReady: false,              // Lobby ready state
      ready: false,                // Round ready state
      sequence: [],                // Player input
      hasSubmitted: false,
      lastSubmitTime: null,
      // Power-ups
      hasUsedSecondChance: false,
      hasUsedPatternPeek: false,
      freezeUsedThisRound: false,
      freezeTimeRemaining: 0,
      isWatchingSecondChance: false
    }
  },
  
  // Game State
  sequence: [],                    // Current sequence
  round: 0,                        // Current round number
  gameStarted: false,
  phase: 'lobby',                  // lobby, game, postgame
  currentPhase: null,              // GET_READY, SEQUENCE, PLAY, ROUND_END
  mode: 'NORMAL',                  // NORMAL or SUDDEN_DEATH
  
  // Round Tracking
  aliveAtRoundStart: 0,            // Alive count snapshot
  aliveAfterRound: 0,              // Alive count after round
  
  // Sudden Death
  isSuddenDeath: false,
  suddenDeathPlayers: null,        // Frozen list [id1, id2]
  suddenDeathLength: 5,            // Fixed sequence length
  
  // Lobby State
  startRequested: false,           // Host initiated start
  startCountdownTimer: null,       // Countdown timeout
  startCountdownEndsAt: null,      // Countdown end timestamp
  
  // Phase Timers
  readyTimer: null,                // Play phase timer
  getReadyTimeout: null,           // GET_READY auto-advance
  sequenceTimeout: null,           // SEQUENCE auto-advance
  
  // Second Chance State
  secondChanceRemainingTime: null, // Paused timer value
  secondChancePlayerId: null,      // Player using SC
  
  // Settings
  settings: {
    maxPlayers: 6,                 // 2-6
    maxRounds: 15,                 // 15-30
    powerUpsEnabled: true,         // true/false
    isPrivate: true                // true/false
  },
  
  // Deprecated (kept for compatibility)
  tieBreakerActive: false,
  tiePlayers: [],
  gameEnding: false,
  colorCounter: 0
}
```

### Client State
```javascript
// Global State Variables
let socket = null;                 // Socket.IO connection
let myName = "";                   // Player name
let currentRoomId = null;          // Current room
let isHost = false;                // Host status
let mySequence = [];               // Player input buffer
let isMyTurn = false;              // Input lock
let currentPhase = null;           // Current phase
let timerInterval = null;          // Timer update interval
let countdownInterval = null;      // Countdown interval
let isSpectator = false;           // Spectator mode
```

---

## Game Flow

### 1. Lobby Phase
```
Player joins → Name registration → Ready up → Host starts
                                              ↓
                                    All ready? → Start immediately
                                              ↓
                                    Not all ready? → 30s countdown
                                              ↓
                                    Countdown ends → Start game
```

**Lobby State Machine:**
```javascript
// Race condition fix: Order doesn't matter
if (hostStarted && allPlayersReady) {
  startImmediately();
} else if (hostStarted && !allPlayersReady) {
  startCountdown();
}
```

### 2. Game Phase Cycle
```
GET_READY (3s)
  ↓
  Players see "Get Ready!" message
  ↓
SEQUENCE (dynamic)
  ↓
  Show color sequence with sounds
  ↓
PLAY (30s timer)
  ↓
  Players input their sequence
  ↓
ROUND_END (3s)
  ↓
  Show results, update scores
  ↓
Check game end conditions
  ↓
  Continue? → Next round (GET_READY)
  Victory? → Game Over
  Draw? → Game Over
  1v1 tie? → Sudden Death
```

### 3. Sudden Death Flow
```
Detect: Exactly 2 players both fail in same round
  ↓
Revive both players with 1 life
  ↓
Set mode = SUDDEN_DEATH
  ↓
Freeze suddenDeathPlayers list
  ↓
Generate fixed 5-tile sequence
  ↓
SEQUENCE → PLAY → ROUND_END
  ↓
One correct? → Winner
Both wrong? → Repeat sudden death
```

### 4. Elimination Flow
```
Player fails (wrong answer or timeout)
  ↓
Lose 1 life
  ↓
Lives > 0? → Continue playing
Lives = 0? → Eliminate player
  ↓
Set alive = false
  ↓
Broadcast elimination event
  ↓
Check remaining players
  ↓
1 player left? → Victory
2 players both failed? → Check sudden death
3+ players all failed? → Draw
```

---

## Socket Communication

### Event Flow Diagram
```
CLIENT                          SERVER
  │                               │
  ├─── createRoom ───────────────>│
  │<──── roomCreated ─────────────┤
  │                               │
  ├─── joinRoom ─────────────────>│
  │<──── roomState ───────────────┤
  │<──── playerList ──────────────┤
  │                               │
  ├─── toggleReady ──────────────>│
  │<──── roomState ───────────────┤
  │                               │
  ├─── startGame ────────────────>│
  │<──── gameStarting ────────────┤
  │<──── phaseChange ─────────────┤
  │                               │
  │<──── showSequence ────────────┤
  │                               │
  ├─── sequenceWatched ──────────>│
  │<──── phaseChange ─────────────┤
  │                               │
  ├─── submitSequence ───────────>│
  │<──── submissionResult ────────┤
  │<──── playerEliminated ────────┤
  │<──── roundEnd ────────────────┤
  │                               │
  │<──── gameOver ────────────────┤
  │                               │
```

### Critical Events

#### Room Management
```javascript
// Client → Server
createRoom({ name, options })
joinRoom({ roomId, name })
leaveRoom()
kickPlayer({ playerId })

// Server → Client
roomCreated({ roomId, hostId })
roomState({ players, settings, ... })
playerJoined({ player })
playerLeft({ playerId, playerName })
```

#### Lobby System
```javascript
// Client → Server
toggleReady()
startGame()
cancelGameStart()
updateGameSettings({ maxPlayers, maxRounds, powerUpsEnabled })

// Server → Client
gameStarting({ endsAt, duration })
gameStartCancelled()
settingsUpdated({ settings })
```

#### Game Flow
```javascript
// Client → Server
playerReadyForSequence()      // GET_READY complete
sequenceWatched()              // SEQUENCE complete
submitSequence({ sequence })   // Player answer

// Server → Client
phaseChange({ phase, round, sequenceLength })
showSequence({ sequence, round })
submissionResult({ correct, score, lives })
roundEnd({ results, scores })
```

#### Elimination & Victory
```javascript
// Server → Client
playerEliminated({ playerId, playerName, reason })
gameOver({ 
  winner, 
  isDraw, 
  finalScores, 
  totalRounds,
  gameMode 
})
suddenDeathStart({ players })
```

#### Power-Ups
```javascript
// Client → Server
activateSecondChance()
activateFreeze()
activatePatternPeek()
secondChanceReplayComplete()

// Server → Client
secondChanceActivated({ sequence, pausedTime })
freezeActivated({ duration })
patternPeekActivated({ sequence })
powerUpError({ message })
```

---

## Data Structures

### Sequence Generation
```javascript
const COLORS = ["red", "green", "blue", "yellow"];

function generateSequence(room, length) {
  room.sequence = [];
  for (let i = 0; i < length; i++) {
    room.sequence.push(
      COLORS[Math.floor(Math.random() * COLORS.length)]
    );
  }
}
```

### Score Calculation
```javascript
function calculateScore(sequenceLength, timeRemaining, consecutiveCorrect) {
  const basePoints = sequenceLength * 10;
  const timeBonus = Math.floor(timeRemaining / 1000) * 2;
  const comboMultiplier = 1 + (consecutiveCorrect * 0.1);
  
  return Math.round((basePoints + timeBonus) * comboMultiplier);
}
```

### Player Lookup Maps
```javascript
// Socket ID → Room ID mapping
const playerRoom = {};

// Room ID → Room Object mapping
const rooms = {};

// Usage
const roomId = playerRoom[socket.id];
const room = rooms[roomId];
const player = room.players[socket.id];
```

---

## Key Algorithms

### 1. Lobby Start Logic (Race Condition Fix)
```javascript
// Authoritative gate function
function canStartGame(room) {
  return room.phase === 'lobby' &&
         !room.gameStarted &&
         Object.keys(room.players).length >= 2 &&
         room.startRequested &&
         checkAllPlayersReady(room);
}

// Smart start function (called from both handlers)
function tryStartGame(room) {
  if (canStartGame(room)) {
    // Both conditions met - start immediately
    clearGameCountdown(room);
    actuallyStartGame(room);
  } else if (room.startRequested && !room.startCountdownTimer) {
    // Host started but not all ready - countdown
    startGameCountdown(room);
  }
}
```

### 2. Sudden Death Detection
```javascript
function detectSuddenDeathCondition(room) {
  // Must be in NORMAL mode
  if (room.mode !== 'NORMAL') return false;
  
  // Count alive players
  const alivePlayers = Object.values(room.players)
    .filter(p => p.alive);
  
  // Must be exactly 2 players
  if (alivePlayers.length !== 2) return false;
  
  // Both must have failed this round
  const bothFailed = alivePlayers.every(p => 
    !p.hasSubmitted || 
    !arraysEqual(p.sequence, room.sequence)
  );
  
  return bothFailed;
}
```

### 3. Sequence Validation
```javascript
function checkSequence(room, player) {
  const correct = arraysEqual(player.sequence, room.sequence);
  
  if (correct) {
    // Calculate score with bonuses
    const timeRemaining = player.freezeTimeRemaining || 
                         (30000 - (Date.now() - roundStartTime));
    player.score += calculateScore(
      room.sequence.length,
      timeRemaining,
      player.consecutiveCorrect
    );
    player.consecutiveCorrect++;
  } else {
    // Wrong answer
    player.lives--;
    player.consecutiveCorrect = 0;
    
    if (player.lives <= 0) {
      eliminatePlayer(room, player);
    }
  }
  
  return correct;
}
```

### 4. Timer Management
```javascript
function startPlayPhaseTimer(room) {
  const PLAY_DURATION = 30000; // 30 seconds
  
  room.playPhaseEndsAt = Date.now() + PLAY_DURATION;
  
  room.readyTimer = setTimeout(() => {
    // Auto-submit for players who haven't submitted
    for (const id in room.players) {
      const p = room.players[id];
      if (p.alive && !p.hasSubmitted) {
        p.lives--;
        if (p.lives <= 0) {
          eliminatePlayer(room, p);
        }
      }
    }
    transitionToRoundEnd(room);
  }, PLAY_DURATION);
}
```

### 5. Phase Transition System
```javascript
function transitionToGetReady(room) {
  room.currentPhase = 'GET_READY';
  clearPhaseTimers(room);
  
  // Reset player states
  for (const id in room.players) {
    room.players[id].ready = false;
    room.players[id].hasSubmitted = false;
    room.players[id].sequence = [];
  }
  
  // Broadcast phase change
  io.to(room.id).emit('phaseChange', {
    phase: 'GET_READY',
    round: room.round,
    sequenceLength: room.sequence.length
  });
  
  // Auto-advance after 3 seconds
  room.getReadyTimeout = setTimeout(() => {
    transitionToSequence(room);
  }, 3000);
}
```

---

## Security & Validation

### Input Validation
```javascript
// Room code normalization
function normalizeRoomCode(code) {
  if (typeof code !== 'string') return null;
  const normalized = code.trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(normalized)) return null;
  return normalized;
}

// Player name validation
function validatePlayerName(name) {
  if (typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= 20;
}

// Settings validation
function validateSettings(settings) {
  if (settings.maxPlayers) {
    const max = parseInt(settings.maxPlayers);
    if (isNaN(max) || max < 2 || max > 6) {
      return { valid: false, error: "Max players must be 2-6" };
    }
  }
  
  if (settings.maxRounds) {
    const rounds = parseInt(settings.maxRounds);
    if (isNaN(rounds) || rounds < 15 || rounds > 30) {
      return { valid: false, error: "Max rounds must be 15-30" };
    }
  }
  
  return { valid: true };
}
```

### Authorization Checks
```javascript
// Host-only actions
socket.on("startGame", () => {
  const room = getRoom(playerRoom[socket.id]);
  if (!room) return;
  
  // Verify sender is host
  if (socket.id !== room.hostId) {
    socket.emit("error", "Only host can start game");
    return;
  }
  
  // ... proceed with action
});

// Alive-only actions
socket.on("submitSequence", (data) => {
  const room = getRoom(playerRoom[socket.id]);
  const player = room.players[socket.id];
  
  // Verify player is alive
  if (!player.alive) {
    socket.emit("error", "Eliminated players cannot submit");
    return;
  }
  
  // ... proceed with action
});
```

### State Consistency
```javascript
// Prevent double elimination
function eliminatePlayer(room, player) {
  if (!player.alive) return; // Already eliminated
  
  player.alive = false;
  player.lives = 0;
  
  io.to(room.id).emit("playerEliminated", {
    playerId: player.id,
    playerName: player.name,
    reason: "eliminated"
  });
}

// Prevent timer leaks
function clearPhaseTimers(room) {
  if (room.readyTimer) {
    clearTimeout(room.readyTimer);
    room.readyTimer = null;
  }
  if (room.getReadyTimeout) {
    clearTimeout(room.getReadyTimeout);
    room.getReadyTimeout = null;
  }
  if (room.sequenceTimeout) {
    clearTimeout(room.sequenceTimeout);
    room.sequenceTimeout = null;
  }
}
```

---

## Performance Considerations

### Memory Management
- Rooms deleted when empty
- Timers cleared on phase transitions
- Player disconnections handled gracefully
- No memory leaks from abandoned rooms

### Scalability Limits
- Single server instance (no clustering)
- In-memory state (no persistence)
- Recommended: Max 50 concurrent rooms
- Each room: Max 6 players

### Optimization Strategies
- Event batching for state updates
- Minimal payload sizes
- Efficient array operations
- Timer consolidation
- Lazy evaluation where possible

---

## Error Handling

### Client-Side
```javascript
socket.on("error", (message) => {
  showErrorModal(message);
});

socket.on("disconnect", () => {
  showReconnectingUI();
});

socket.on("connect_error", (error) => {
  console.error("Connection failed:", error);
  showConnectionError();
});
```

### Server-Side
```javascript
// Graceful error handling
socket.on("submitSequence", (data) => {
  try {
    const room = getRoom(playerRoom[socket.id]);
    if (!room) {
      socket.emit("error", "Room not found");
      return;
    }
    
    // ... process submission
  } catch (error) {
    console.error("Error in submitSequence:", error);
    socket.emit("error", "An error occurred");
  }
});

// Disconnect cleanup
socket.on("disconnect", () => {
  const roomId = playerRoom[socket.id];
  const room = getRoom(roomId);
  
  if (room) {
    handlePlayerDisconnect(room, socket.id);
  }
  
  delete playerRoom[socket.id];
});
```

---

## Testing Considerations

### Critical Test Scenarios
1. **Lobby race conditions**: Host start vs player ready order
2. **Sudden death triggers**: Exactly 2 players both fail
3. **Draw conditions**: 3+ players all fail
4. **Power-up interactions**: Second Chance timer pause
5. **Elimination cascades**: Multiple eliminations same round
6. **Host migration**: Host disconnect handling
7. **Timer accuracy**: Phase transitions and timeouts
8. **Concurrent submissions**: Multiple players submit simultaneously

### Manual Testing Checklist
- [ ] Create room with various settings
- [ ] Join room with valid/invalid codes
- [ ] Ready system with different player counts
- [ ] Countdown cancellation
- [ ] Normal game flow (all phases)
- [ ] Correct answer scoring
- [ ] Wrong answer elimination
- [ ] Timeout elimination
- [ ] 1v1 sudden death trigger
- [ ] 3+ player draw trigger
- [ ] Each power-up activation
- [ ] Spectator mode after elimination
- [ ] Rematch functionality
- [ ] Player kick (host)
- [ ] Host disconnect
- [ ] Player disconnect mid-game

---

## Deployment Considerations

### Environment Variables
```javascript
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
```

### Production Checklist
- [ ] Enable HTTPS for secure WebSocket
- [ ] Configure CORS properly
- [ ] Set up process manager (PM2)
- [ ] Enable logging and monitoring
- [ ] Configure rate limiting
- [ ] Set up health check endpoint
- [ ] Enable compression
- [ ] Configure proper timeouts
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure CDN for static assets

### Monitoring Metrics
- Active room count
- Active player count
- Average game duration
- Socket connection count
- Memory usage
- CPU usage
- Error rates
- Latency measurements

---

## Future Architecture Improvements

### Scalability
- Redis for shared state (multi-server)
- Database for persistence
- Load balancer for horizontal scaling
- Microservices architecture

### Features
- Replay system (event sourcing)
- Matchmaking service
- Leaderboard service
- Authentication service
- Analytics pipeline

### Performance
- WebRTC for peer-to-peer audio
- Client-side prediction
- Server-side interpolation
- Delta compression for state updates

---

**This architecture supports a robust, real-time multiplayer experience with room for future enhancements while maintaining code clarity and maintainability.**
