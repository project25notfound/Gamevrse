# 🏗️ Blackjack Roulette - Architecture Documentation

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Patterns](#architecture-patterns)
3. [Server Architecture](#server-architecture)
4. [Client Architecture](#client-architecture)
5. [Communication Protocol](#communication-protocol)
6. [State Management](#state-management)
7. [Game Flow](#game-flow)
8. [Module Breakdown](#module-breakdown)
9. [Data Structures](#data-structures)
10. [Security Considerations](#security-considerations)

---

## System Overview

Blackjack Roulette is a real-time multiplayer web application built on a client-server architecture using WebSockets for bidirectional communication.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Browser  │  │ Browser  │  │ Browser  │  │ Browser  │   │
│  │ Player 1 │  │ Player 2 │  │ Player 3 │  │ Player N │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │             │             │             │           │
│       └─────────────┴─────────────┴─────────────┘           │
│                          │                                   │
│                    WebSocket (Socket.IO)                     │
│                          │                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │
┌──────────────────────────┼───────────────────────────────────┐
│                    Server Layer                              │
│                          │                                   │
│              ┌───────────▼──────────┐                        │
│              │   Express Server     │                        │
│              │   (Node.js)          │                        │
│              └───────────┬──────────┘                        │
│                          │                                   │
│              ┌───────────▼──────────┐                        │
│              │  Socket.IO Server    │                        │
│              │  (WebSocket Handler) │                        │
│              └───────────┬──────────┘                        │
│                          │                                   │
│              ┌───────────▼──────────┐                        │
│              │   Game Logic Engine  │                        │
│              │  - Room Management   │                        │
│              │  - Turn System       │                        │
│              │  - Elimination Logic │                        │
│              │  - Bot AI            │                        │
│              └───────────┬──────────┘                        │
│                          │                                   │
│              ┌───────────▼──────────┐                        │
│              │   In-Memory Storage  │                        │
│              │   (Rooms & Players)  │                        │
│              └──────────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Backend:**
- Node.js v14+
- Express.js (HTTP server)
- Socket.IO v4 (WebSocket communication)

**Frontend:**
- Vanilla JavaScript (ES6+)
- CSS3 (Animations, Grid, Flexbox)
- HTML5 (Semantic markup)
- Web Audio API (Sound synthesis)

**No External Dependencies:**
- No frontend frameworks (React, Vue, etc.)
- No database (in-memory storage)
- No authentication system
- No build tools required

---

## Architecture Patterns

### 1. Client-Server Pattern

- **Server Authority**: All game logic runs on server
- **Client Rendering**: Clients only render state received from server
- **Event-Driven**: Actions trigger events, server validates and broadcasts

### 2. Event-Driven Architecture

```javascript
// Client sends action
socket.emit('hit');

// Server validates and processes
socket.on('hit', (playerId) => {
  // Validate turn
  // Add card
  // Check bust
  // Broadcast new state
});

// All clients receive update
socket.on('state', (newState) => {
  // Update UI
});
```

### 3. Modular Design

**Server**: Single file with clear function separation
**Client**: Module-based architecture with ES6 imports

```
client/
├── index.js           # Main orchestrator
├── state.js           # State management
└── ui/
    ├── audio.js       # Sound system
    ├── screens.js     # Screen transitions
    ├── overlays.js    # Notifications
    └── [feature].js   # Feature modules
```

### 4. State Synchronization Pattern

```
Server State (Source of Truth)
        ↓
    Broadcast
        ↓
Client State (Read-Only Mirror)
        ↓
    Render UI
```

---

## Server Architecture

### Core Components

#### 1. Room Management System


```javascript
const rooms = {}; // In-memory storage

// Room Structure
{
  roomCode: {
    players: {},           // Player objects by socket ID
    deck: [],             // Shuffled deck
    currentPlayerOrder: [], // Turn order
    turnIndex: 0,         // Current turn
    roundActive: false,   // Round state
    gameOver: false,      // Game state
    hostId: 'socket_id',  // Host player
    rules: {
      eliminationMode: 'standard' // or 'lowestHand'
    },
    turnTimer: null,      // Turn timeout
    rouletteTimer: null,  // Roulette timeout
    bannedPlayers: []     // Kicked player IDs
  }
}
```

**Key Functions:**
- `generateRoomCode()`: Creates unique 4-letter codes
- `createRoom(hostId, hostName)`: Initializes new room
- `joinRoom(roomCode, playerId, playerName)`: Adds player to room
- `removePlayer(roomCode, playerId)`: Handles disconnections

#### 2. Game Loop Engine

**Phase Flow:**
```
Lobby → Round Start → Blackjack Phase → Elimination Selection → 
Roulette Phase → Result → Next Round / Victory
```

**Core Functions:**
- `startRound(roomCode)`: Initializes round, deals cards
- `nextTurn(roomCode)`: Advances to next player
- `selectRoulettePlayer(roomCode)`: Chooses elimination candidate
- `executeRouletteResult(roomCode, playerId)`: Processes roulette outcome
- `checkVictory(roomCode)`: Detects game end condition

#### 3. Turn Management System

```javascript
// Turn Timer
function startTurnTimer(roomCode) {
  const room = rooms[roomCode];
  clearTurnTimer(roomCode);
  
  room.turnDeadline = Date.now() + TURN_DURATION;
  room.turnTimer = setTimeout(() => {
    autoStand(roomCode); // Auto-action on timeout
  }, TURN_DURATION);
}
```

**Features:**
- 15-second turn timer
- Auto-stand on timeout
- Timer cleanup on disconnect
- Server-authoritative timing

#### 4. Bot AI System

**Decision Making:**


```javascript
// Bot Strategy (Mode-Aware)
function getBotDecision(bot, gameState) {
  const mode = gameState.rules?.eliminationMode || 'standard';
  
  if (mode === 'lowestHand') {
    return getBotDecisionLowestHandMode(bot, gameState);
  } else {
    return getBotDecisionStandardMode(bot, gameState);
  }
}
```

**Difficulty Levels:**
- **Easy**: Conservative (hit until 17)
- **Normal**: Balanced (considers other players)
- **Hard**: Strategic (mode-aware, aggressive)

**Bot Capabilities:**
- Blackjack decisions (hit/stand)
- Roulette choices (risk level, timing)
- Mode-aware strategy adaptation
- Second Chance Card usage

#### 5. Elimination Logic

**Standard Mode:**
```javascript
if (busted.length > 0) {
  candidates = busted; // Busted players first
} else {
  const lowestValue = Math.min(...nonBusted.map(p => handValue(p.hand)));
  candidates = nonBusted.filter(p => handValue(p.hand) === lowestValue);
}
```

**Lowest-Hand Mode:**
```javascript
const lowestValue = Math.min(...alive.map(p => handValue(p.hand)));
candidates = alive.filter(p => handValue(p.hand) === lowestValue);
// Bust status ignored
```

**Final 2 Override:**
```javascript
if (alive.length === 2 && busted.length === 1) {
  return busted[0]; // Bust overrides mode
}
```

---

## Client Architecture

### Module System

#### 1. Main Orchestrator (`index.js`)

**Responsibilities:**
- Socket.IO connection management
- Event listener registration
- State update coordination
- UI module orchestration

**Key Sections:**


```javascript
// Socket Event Handlers
socket.on('state', handleStateUpdate);
socket.on('log', handleGameLog);
socket.on('rouletteChoice', handleRouletteChoice);
socket.on('victory', handleVictory);

// UI Event Handlers
hitBtn.onclick = () => socket.emit('hit');
standBtn.onclick = () => socket.emit('stand');
```

#### 2. State Management (`state.js`)

```javascript
export const state = {
  roomCode: null,
  myId: null,
  phase: 'intro', // intro, lobby, game, postgame
  players: [],
  currentTurn: null,
  roundActive: false,
  // ... other state
};
```

**State Updates:**
- Immutable updates from server
- Local state for UI-only data
- No client-side game logic

#### 3. UI Modules

**Screen Management (`screens.js`):**
```javascript
export function setScreen(screenName) {
  // Hide all screens
  // Show target screen
  // Update state.phase
}
```

**Audio System (`audio.js`):**
```javascript
// Mute state management
let isMuted = false;

export function play(sound) {
  if (isMuted) return;
  sound.play();
}

export function toggleMute() {
  isMuted = !isMuted;
  localStorage.setItem('blackjackRouletteMuted', isMuted);
}
```

**Notification System (`overlays.js`):**
```javascript
export function showNotification(title, message, type) {
  // Create notification element
  // Add to queue
  // Auto-dismiss after timeout
  // Support types: success, error, warning, info
}
```

**Player Rendering (`renderPlayers.js`):**
```javascript
export function renderPlayers(players, myId, currentTurn) {
  // Create player cards
  // Show hand, status, indicators
  // Highlight current turn
  // Show Second Chance Card icon
}
```

**Roulette Modal (`rouletteChoice.js`):**


```javascript
export function showRouletteChoice(playerName, callback, options) {
  // Display modal
  // Enable/disable Second Chance button
  // Start 30-second countdown
  // Handle player choices
  // Submit via callback
}
```

**Practice Mode (`practiceMode.js`):**
```javascript
export function showPracticeSetup() {
  // Bot count selection (1-5)
  // Difficulty selection (easy, normal, hard)
  // Elimination mode selection
  // Create practice room with bots
}
```

**Tutorial Mode (`tutorialMode.js`):**
```javascript
// 3-Phase Interactive Tutorial
const tutorialPhases = [
  { title: "Phase 1: Blackjack Basics", steps: [...] },
  { title: "Phase 2: Elimination Logic", steps: [...] },
  { title: "Phase 3: Advanced Rules", steps: [...] }
];

// Guided gameplay with scripted scenarios
```

**Spectator Features (`spectatorFeatures.js`):**
```javascript
export function showSpectatorBanner() {
  // Display spectator indicator
  // Show emoji reactions
  // "Join Next Game" button
}
```

---

## Communication Protocol

### Socket.IO Events

#### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `createRoom` | `{ name }` | Create new room |
| `joinRoom` | `{ roomCode, name }` | Join existing room |
| `ready` | - | Mark player as ready |
| `startRound` | - | Host starts round |
| `hit` | - | Draw card |
| `stand` | - | Keep hand |
| `submitRouletteChoice` | `{ useSecondChance, timing }` | Roulette decision |
| `setEliminationMode` | `mode` | Change elimination mode |
| `kickPlayer` | `playerId` | Kick player (host only) |

#### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `state` | `{ players, phase, ... }` | Full game state |
| `log` | `message` | Game log entry |
| `roomCreated` | `{ roomCode }` | Room creation success |
| `roomJoined` | `{ roomCode, players }` | Join success |
| `rouletteChoice` | `{ playerName, hasSecondChance }` | Roulette prompt |
| `triggerAnimation` | `{ loserName, timing, useSecondChance }` | Trigger animation |
| `victory` | `{ winnerId, winnerName }` | Game end |
| `error` | `message` | Error notification |

### State Broadcast Pattern

```javascript
// Server broadcasts state after every action
function broadcastState(roomCode) {
  const room = rooms[roomCode];
  const state = {
    players: Object.values(room.players).map(serializePlayer),
    currentTurn: room.currentPlayerOrder[room.turnIndex],
    roundActive: room.roundActive,
    gameOver: room.gameOver,
    hostId: room.hostId,
    eliminationMode: room.rules.eliminationMode,
    turnDeadline: room.turnDeadline
  };
  io.to(roomCode).emit('state', state);
}
```

---

## State Management

### Server State (Source of Truth)

**Room State:**


```javascript
{
  players: {
    'socket_id': {
      id: 'socket_id',
      name: 'PlayerName',
      hand: [{ rank: '7', suit: '♠' }],
      alive: true,
      busted: false,
      stood: false,
      host: false,
      wins: 0,
      spectator: false,
      hasSecondChance: true,
      secondChanceUsed: false,
      isBot: false
    }
  },
  deck: [...],
  currentPlayerOrder: ['id1', 'id2', 'id3'],
  turnIndex: 0,
  roundActive: false,
  gameOver: false,
  hostId: 'socket_id',
  rules: { eliminationMode: 'standard' },
  turnTimer: null,
  rouletteTimer: null,
  bannedPlayers: []
}
```

### Client State (Read-Only Mirror)

```javascript
{
  roomCode: 'ABCD',
  myId: 'socket_id',
  phase: 'game', // intro, lobby, game, postgame
  players: [...], // Received from server
  currentTurn: 'socket_id',
  roundActive: true,
  gameOver: false,
  hostId: 'socket_id',
  eliminationMode: 'standard'
}
```

### State Synchronization Flow

```
1. Player Action (Client)
   ↓
2. Emit Event (Socket.IO)
   ↓
3. Validate Action (Server)
   ↓
4. Update State (Server)
   ↓
5. Broadcast State (Socket.IO)
   ↓
6. Receive State (All Clients)
   ↓
7. Update UI (Client Rendering)
```

---

## Game Flow

### Complete Game Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                      INTRO SCREEN                            │
│  - Enter name                                                │
│  - Create/Join room                                          │
│  - Practice mode                                             │
│  - Tutorial                                                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      LOBBY SCREEN                            │
│  - Wait for players (2-6)                                    │
│  - Host controls (elimination mode, kick)                    │
│  - Ready system                                              │
│  - Host starts round                                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   BLACKJACK PHASE                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ For each player in turn:                            │    │
│  │  1. 15-second timer starts                          │    │
│  │  2. Player chooses: Hit or Stand                    │    │
│  │  3. If Hit: Add card, check bust                    │    │
│  │  4. If Stand: Mark stood, next turn                 │    │
│  │  5. If Timeout: Auto-stand                          │    │
│  └─────────────────────────────────────────────────────┘    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 ELIMINATION SELECTION                        │
│  - Calculate who goes to roulette                            │
│  - Standard Mode: Busted → Lowest                            │
│  - Lowest-Hand Mode: Always lowest                           │
│  - Final 2: Bust override                                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    ROULETTE PHASE                            │
│  1. Show roulette modal to chosen player                     │
│  2. 30-second choice timer                                   │
│  3. Player selects:                                          │
│     - Risk: Normal or Second Chance Card                     │
│     - Timing: Instant or Dramatic                            │
│  4. Trigger animation plays                                  │
│  5. Roll dice (1-6)                                          │
│  6. Result: Eliminated (1-2) or Safe (3-6)                   │
│  7. Update player status                                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
                    Check Victory?
                    /          \
                  Yes           No
                   │             │
                   ▼             ▼
            ┌──────────┐   ┌──────────┐
            │ VICTORY  │   │   NEXT   │
            │  SCREEN  │   │  ROUND   │
            │          │   │          │
            │ 8s delay │   │ 2s delay │
            │    ↓     │   │    ↓     │
            │  LOBBY   │   │ BLACKJACK│
            └──────────┘   └──────────┘
```

### Round Flow Detail

**1. Round Initialization:**


```javascript
function startRound(roomCode) {
  const room = rooms[roomCode];
  
  // 1. Reset player states
  Object.values(room.players).forEach(p => {
    p.hand = [];
    p.busted = false;
    p.stood = false;
  });
  
  // 2. Shuffle deck
  room.deck = shuffleDeck();
  
  // 3. Deal initial cards (2 per player)
  dealInitialCards(room);
  
  // 4. Set turn order
  room.currentPlayerOrder = Object.keys(room.players)
    .filter(id => room.players[id].alive && !room.players[id].spectator);
  room.turnIndex = 0;
  
  // 5. Activate round
  room.roundActive = true;
  
  // 6. Start first turn
  startTurnTimer(roomCode);
  
  // 7. Broadcast state
  broadcastState(roomCode);
}
```

**2. Turn Processing:**
```javascript
function processTurn(roomCode, action) {
  const room = rooms[roomCode];
  const player = room.players[room.currentPlayerOrder[room.turnIndex]];
  
  if (action === 'hit') {
    // Add card
    const card = room.deck.pop();
    player.hand.push(card);
    
    // Check bust
    if (handValue(player.hand) > 21) {
      player.busted = true;
      nextTurn(roomCode);
    }
  } else if (action === 'stand') {
    player.stood = true;
    nextTurn(roomCode);
  }
  
  broadcastState(roomCode);
}
```

**3. Elimination Processing:**
```javascript
function selectRoulettePlayer(roomCode) {
  const room = rooms[roomCode];
  const alive = Object.values(room.players).filter(p => p.alive && !p.spectator);
  
  // Apply elimination mode logic
  const chosen = applyEliminationMode(alive, room.rules.eliminationMode);
  
  // Send roulette choice to chosen player
  io.to(chosen.id).emit('rouletteChoice', {
    playerName: chosen.name,
    hasSecondChance: chosen.hasSecondChance && !chosen.secondChanceUsed
  });
  
  // Start roulette timer
  startRouletteTimer(roomCode, chosen.id);
}
```

---

## Module Breakdown

### Server Modules (server.js)

| Function Category | Key Functions | Purpose |
|------------------|---------------|---------|
| **Room Management** | `generateRoomCode()`, `createRoom()`, `joinRoom()` | Room lifecycle |
| **Game Loop** | `startRound()`, `nextTurn()`, `endRound()` | Round management |
| **Card System** | `shuffleDeck()`, `dealCard()`, `handValue()` | Deck operations |
| **Elimination** | `selectRoulettePlayer()`, `executeRouletteResult()` | Roulette logic |
| **Bot AI** | `getBotDecision()`, `getBotRouletteChoice()` | AI behavior |
| **Timer System** | `startTurnTimer()`, `clearTurnTimer()` | Timeout handling |
| **Victory** | `checkVictory()`, `handleVictory()` | Game end |
| **Disconnect** | `handleDisconnect()`, `removePlayer()` | Connection loss |

### Client Modules

| Module | File | Exports | Purpose |
|--------|------|---------|---------|
| **Main** | `index.js` | - | Orchestration, socket handlers |
| **State** | `state.js` | `state` | Global state object |
| **Audio** | `audio.js` | `play()`, `toggleMute()`, sounds | Sound system |
| **Screens** | `screens.js` | `setScreen()` | Screen transitions |
| **Overlays** | `overlays.js` | `showNotification()` | Notifications |
| **Players** | `renderPlayers.js` | `renderPlayers()` | Player cards |
| **Lobby** | `renderLobby.js` | `renderLobbyPlayers()` | Lobby UI |
| **Roulette** | `rouletteChoice.js` | `showRouletteChoice()` | Roulette modal |
| **Victory** | `victoryOverlay.js` | `showVictory()` | Victory screen |
| **Practice** | `practiceMode.js` | `showPracticeSetup()` | Bot setup |
| **Tutorial** | `tutorialMode.js` | `showTutorial()` | Tutorial system |
| **Spectator** | `spectatorFeatures.js` | `showSpectatorBanner()` | Spectator UI |
| **Focus** | `focusTrap.js` | `trapFocus()` | Accessibility |

---

## Data Structures

### Player Object

```typescript
interface Player {
  id: string;              // Socket ID
  name: string;            // Display name (max 15 chars)
  hand: Card[];            // Current hand
  alive: boolean;          // Elimination status
  busted: boolean;         // Over 21
  stood: boolean;          // Finished turn
  host: boolean;           // Room host
  wins: number;            // Victory count
  spectator: boolean;      // Spectator mode
  hasSecondChance: boolean;    // Has card available
  secondChanceUsed: boolean;   // Card used this game
  isBot: boolean;          // AI player
  difficulty?: string;     // Bot difficulty (easy/normal/hard)
}
```

### Card Object

```typescript
interface Card {
  rank: string;  // '2'-'10', 'J', 'Q', 'K', 'A'
  suit: string;  // '♠', '♥', '♦', '♣'
}
```

### Room Object

```typescript
interface Room {
  players: { [socketId: string]: Player };
  deck: Card[];
  currentPlayerOrder: string[];
  turnIndex: number;
  roundActive: boolean;
  gameOver: boolean;
  hostId: string;
  rules: {
    eliminationMode: 'standard' | 'lowestHand';
  };
  turnTimer: NodeJS.Timeout | null;
  rouletteTimer: NodeJS.Timeout | null;
  turnDeadline: number | null;
  bannedPlayers: string[];
}
```

### State Object (Client)

```typescript
interface ClientState {
  roomCode: string | null;
  myId: string | null;
  phase: 'intro' | 'lobby' | 'game' | 'postgame';
  players: Player[];
  currentTurn: string | null;
  roundActive: boolean;
  gameOver: boolean;
  hostId: string | null;
  eliminationMode: 'standard' | 'lowestHand';
}
```

---

## Security Considerations

### Current Implementation

**✅ Implemented:**
- Server-side validation of all actions
- Turn validation (only current player can act)
- Host-only actions (kick, start, mode change)
- Room code validation
- Ban system for kicked players
- Timer-based auto-actions (prevent stalling)

**⚠️ Not Implemented:**
- No authentication system
- No rate limiting
- No input sanitization (XSS vulnerable)
- No CSRF protection
- No encryption (use HTTPS in production)
- No persistent storage (rooms lost on restart)

### Recommendations for Production

1. **Add Authentication:**


```javascript
// Example: JWT-based auth
socket.on('authenticate', (token) => {
  const user = verifyToken(token);
  socket.userId = user.id;
});
```

2. **Add Rate Limiting:**
```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);
```

3. **Sanitize Input:**
```javascript
const sanitizeHtml = require('sanitize-html');
const cleanName = sanitizeHtml(playerName, {
  allowedTags: [],
  allowedAttributes: {}
});
```

4. **Add HTTPS:**
```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

https.createServer(options, app).listen(443);
```

5. **Add Database:**
```javascript
// Example: MongoDB for persistence
const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  roomCode: String,
  players: [PlayerSchema],
  createdAt: Date,
  expiresAt: Date
});
```

6. **Add Logging:**
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

---

## Performance Considerations

### Current Optimizations

1. **In-Memory Storage**: Fast access, no database overhead
2. **Event-Driven**: Non-blocking I/O
3. **Minimal State**: Only essential data transmitted
4. **Client-Side Rendering**: Server only sends data
5. **Timer Cleanup**: Prevents memory leaks

### Scalability Limitations

**Single Server:**
- All rooms on one Node.js process
- Limited by single-thread event loop
- No horizontal scaling

**In-Memory Storage:**
- Rooms lost on restart
- Limited by available RAM
- No persistence

### Scaling Recommendations

1. **Redis for State:**
```javascript
const redis = require('redis');
const client = redis.createClient();

// Store room state in Redis
client.set(`room:${roomCode}`, JSON.stringify(room));
```

2. **Socket.IO Redis Adapter:**
```javascript
const redisAdapter = require('socket.io-redis');
io.adapter(redisAdapter({ host: 'localhost', port: 6379 }));
```

3. **Load Balancer:**
```
Client → Nginx → [Server 1, Server 2, Server 3] → Redis
```

4. **Microservices:**
```
┌─────────────┐
│   Gateway   │
└──────┬──────┘
       │
   ┌───┴───┬───────┬────────┐
   │       │       │        │
┌──▼──┐ ┌──▼──┐ ┌──▼──┐ ┌──▼──┐
│Room │ │Game │ │Bot  │ │Auth │
│Mgmt │ │Logic│ │AI   │ │Svc  │
└─────┘ └─────┘ └─────┘ └─────┘
```

---

## Testing Strategy

### Unit Testing

```javascript
// Example: Test hand value calculation
describe('handValue', () => {
  it('should calculate simple hand', () => {
    const hand = [
      { rank: '7', suit: '♠' },
      { rank: '5', suit: '♥' }
    ];
    expect(handValue(hand)).toBe(12);
  });
  
  it('should handle aces correctly', () => {
    const hand = [
      { rank: 'A', suit: '♠' },
      { rank: 'K', suit: '♥' }
    ];
    expect(handValue(hand)).toBe(21);
  });
});
```

### Integration Testing

```javascript
// Example: Test room creation flow
describe('Room Creation', () => {
  it('should create room and join player', (done) => {
    const client = io.connect('http://localhost:3000');
    
    client.emit('createRoom', { name: 'TestPlayer' });
    
    client.on('roomCreated', (data) => {
      expect(data.roomCode).toHaveLength(4);
      done();
    });
  });
});
```

### End-to-End Testing

```javascript
// Example: Playwright test
test('complete game flow', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.fill('#nameInput', 'Player1');
  await page.click('#createRoomBtn');
  await expect(page.locator('#roomCodeText')).toBeVisible();
});
```

---

## Deployment

### Development

```bash
# Install dependencies
npm install

# Start server
npm start

# Server runs on http://localhost:3000
```

### Production

```bash
# Set environment variables
export NODE_ENV=production
export PORT=80

# Use process manager
pm2 start server.js --name blackjack-roulette

# Monitor
pm2 logs blackjack-roulette
pm2 monit
```

### Docker Deployment

```dockerfile
FROM node:14-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

```bash
# Build and run
docker build -t blackjack-roulette .
docker run -p 3000:3000 blackjack-roulette
```

---

## Future Enhancements

### Planned Features

1. **Persistent Rooms**: Database storage for room state
2. **User Accounts**: Authentication and profiles
3. **Leaderboards**: Global win statistics
4. **Replay System**: Save and replay games
5. **Custom Rules**: Configurable game parameters
6. **Chat System**: Text chat in rooms
7. **Tournaments**: Bracket-style competitions
8. **Achievements**: Unlock badges and rewards

### Technical Improvements

1. **TypeScript Migration**: Type safety
2. **Test Coverage**: Unit and integration tests
3. **CI/CD Pipeline**: Automated deployment
4. **Monitoring**: Application performance monitoring
5. **Analytics**: User behavior tracking
6. **Internationalization**: Multi-language support

---

## Conclusion

Blackjack Roulette demonstrates a clean, modular architecture suitable for real-time multiplayer games. The server-authoritative design ensures fair gameplay, while the event-driven pattern provides responsive user experience.

**Key Strengths:**
- Simple, maintainable codebase
- Real-time multiplayer with WebSockets
- Modular client architecture
- Server-side validation
- No external dependencies (frontend)

**Areas for Improvement:**
- Add authentication and security
- Implement persistent storage
- Add horizontal scaling support
- Improve error handling
- Add comprehensive testing

For questions or contributions, see the main README.md file.

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Maintainer**: Development Team
