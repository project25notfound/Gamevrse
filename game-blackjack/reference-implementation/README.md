# Winner Handling Reference Implementation

This is a **minimal, working example** demonstrating the correct architecture for handling winner animations and automatic lobby transitions in a multiplayer Socket.IO game.

## Architecture Overview

### Core Principles

1. **Server is Single Source of Truth**
   - Server declares winner
   - Server controls phase changes
   - Server controls timing (8-second delay)
   - Server emits `gameReset` to return to lobby

2. **Client Separates Concerns**
   - **Overlay State** (victory overlay) is separate from **Screen State** (lobby/game)
   - Victory overlay has **UI Ownership Flag**
   - All UI rendering checks ownership before executing

3. **Race Condition Prevention**
   - Victory overlay takes ownership immediately
   - Phase changes cannot override victory overlay
   - State updates cannot override victory overlay
   - Only `gameReset` event releases ownership

## File Structure

```
reference-implementation/
├── server.js              # Server (single source of truth)
├── public/
│   ├── index.html         # Minimal HTML
│   └── js/
│       ├── client.js      # Main client logic
│       ├── victoryOverlay.js  # Victory overlay module
│       ├── screenManager.js    # Screen management
│       └── stateManager.js     # State management
└── README.md              # This file
```

## Event Flow

### 1. Game Ends → Victory Declared

```
Server: declareWinner()
  ↓
Server: setPhase('postgame')
  ↓
Server: emit('phaseChange', { phase: 'postgame' })
  ↓
Server: emit('victory', { winnerId, winnerName })
  ↓
Client: victoryOverlay.show(winnerName)
  ↓
Client: victoryOverlay.hasUIOwnership = true
```

### 2. Victory Overlay Visible (8 seconds)

```
Victory Overlay: Shows winner name
Victory Overlay: Starts visual countdown
All Other UI: Checks hasOwnership() before rendering
  → If true, skips rendering (overlay owns UI)
```

### 3. 8 Seconds Pass → Return to Lobby

```
Server: setTimeout(() => returnToLobby(), 8000)
  ↓
Server: emit('gameReset')
  ↓
Client: victoryOverlay.hide()
  ↓
Client: victoryOverlay.hasUIOwnership = false
  ↓
Client: screens.show('lobby')
```

## Key Code Patterns

### Server: Authoritative Winner Declaration

```javascript
function declareWinner(roomCode, winnerId) {
  // 1. Set phase FIRST
  setPhase(roomCode, 'postgame');
  
  // 2. Store winner
  room.winnerId = winnerId;
  
  // 3. Emit victory ONCE
  io.to(roomCode).emit('victory', { winnerId, winnerName });
  
  // 4. Schedule lobby return (server-controlled)
  room.victoryTimer = setTimeout(() => {
    returnToLobby(roomCode);
  }, 8000);
}
```

### Client: UI Ownership Pattern

```javascript
// Victory overlay takes ownership
victoryOverlay.show(winnerName);  // Sets hasUIOwnership = true

// Other UI checks ownership before rendering
function renderLobby() {
  if (victoryOverlay.hasOwnership()) {
    return;  // Skip rendering - overlay owns UI
  }
  // ... render lobby
}
```

### Client: Phase Change Protection

```javascript
socket.on('phaseChange', ({ phase }) => {
  // ⚠️ CRITICAL: Only change screen if overlay doesn't own UI
  if (!victoryOverlay.hasOwnership()) {
    switch (phase) {
      case 'lobby': screens.show('lobby'); break;
      case 'game': screens.show('game'); break;
      case 'postgame': /* Overlay handles this */ break;
    }
  }
});
```

## Running the Example

1. Install dependencies:
```bash
npm install express socket.io
```

2. Start server:
```bash
node server.js
```

3. Open browser:
```
http://localhost:3000
```

4. Test flow:
   - Create/join room
   - Click "Start Game"
   - Wait 2 seconds → Victory overlay appears
   - Wait 8 seconds → Automatically returns to lobby

## Why This Works

### ✅ Prevents Race Conditions

- **Victory overlay takes ownership immediately** → No other UI can render
- **Server controls timing** → No client-side timer conflicts
- **Single victory event** → No duplicate overlays

### ✅ Handles Async Events

- **Phase changes** check ownership before executing
- **State updates** check ownership before rendering
- **Multiple socket events** cannot interfere with victory

### ✅ Clean State Management

- **Overlay state** separate from **screen state**
- **Server state** is authoritative
- **Client state** is just a cache

## Adapting to Your Game

1. **Replace demo logic** in `server.js`:
   - Replace `startGame` handler with your game logic
   - Replace `declareWinner` trigger with your win condition

2. **Customize victory overlay** in `victoryOverlay.js`:
   - Add animations, confetti, sounds
   - Keep the ownership pattern

3. **Add your game screens**:
   - Follow the screen manager pattern
   - Always check `victoryOverlay.hasOwnership()` before rendering

## Key Takeaways

1. **Server controls timing** - Don't rely on client timers
2. **Ownership flag prevents overrides** - Victory overlay owns UI when visible
3. **Separate overlay from screen state** - They can coexist independently
4. **Check ownership before rendering** - All UI must respect ownership

This architecture ensures the victory overlay **always appears** and **cannot be overridden** by any other UI or socket events.

