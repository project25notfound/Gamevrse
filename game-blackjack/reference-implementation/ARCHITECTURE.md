# Architecture Explanation

## Event Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    SERVER (Authoritative)                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Game Logic detects winner                                │
│     ↓                                                         │
│  2. declareWinner(roomCode, winnerId)                        │
│     ├─ setPhase('postgame')                                  │
│     ├─ emit('phaseChange', { phase: 'postgame' })           │
│     ├─ emit('victory', { winnerId, winnerName })            │
│     └─ setTimeout(() => returnToLobby(), 8000)              │
│                                                               │
│  3. After 8 seconds:                                         │
│     returnToLobby()                                          │
│     ├─ emit('gameReset')                                    │
│     └─ emit('phaseChange', { phase: 'lobby' })              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ Socket.IO Events
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Reactive)                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Socket Events Received:                                      │
│                                                               │
│  ┌─────────────────────────────────────────┐                │
│  │ 'phaseChange' event                     │                │
│  │                                         │                │
│  │ if (!victoryOverlay.hasOwnership()) {   │                │
│  │   screens.show(phase)                   │                │
│  │ }                                       │                │
│  └─────────────────────────────────────────┘                │
│                                                               │
│  ┌─────────────────────────────────────────┐                │
│  │ 'victory' event                         │                │
│  │                                         │                │
│  │ victoryOverlay.show(winnerName)         │                │
│  │   ├─ hasUIOwnership = true              │                │
│  │   ├─ overlay.classList.remove('hidden')│                │
│  │   └─ startCountdown()                   │                │
│  └─────────────────────────────────────────┘                │
│                                                               │
│  ┌─────────────────────────────────────────┐                │
│  │ 'gameReset' event                       │                │
│  │                                         │                │
│  │ victoryOverlay.hide()                   │                │
│  │   ├─ hasUIOwnership = false             │                │
│  │   └─ overlay.classList.add('hidden')    │                │
│  │                                         │                │
│  │ screens.show('lobby')                    │                │
│  └─────────────────────────────────────────┘                │
│                                                               │
│  Rendering Functions:                                        │
│                                                               │
│  renderLobby() {                                             │
│    if (victoryOverlay.hasOwnership()) return;  ← CHECK       │
│    // ... render lobby                                       │
│  }                                                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## State Separation

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT STATE                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │  Screen State        │  │  Overlay State       │        │
│  │                      │  │                      │        │
│  │  - lobby             │  │  - hasUIOwnership    │        │
│  │  - game              │  │  - visible          │        │
│  │                      │  │  - winnerName       │        │
│  │  Managed by:         │  │                      │        │
│  │  ScreenManager       │  │  Managed by:         │        │
│  │                      │  │  VictoryOverlay     │        │
│  └──────────────────────┘  └──────────────────────┘        │
│                                                               │
│  These are INDEPENDENT:                                       │
│  - Screen can be 'lobby' while overlay is visible            │
│  - Overlay owns UI when hasUIOwnership = true                │
│  - Screen changes are blocked when overlay owns UI           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## UI Ownership Pattern

```
┌─────────────────────────────────────────────────────────────┐
│              UI Ownership Flow                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Normal State:                                                │
│    victoryOverlay.hasOwnership() = false                      │
│    → All UI can render normally                               │
│                                                               │
│  Victory Declared:                                            │
│    victoryOverlay.show()                                      │
│    → hasOwnership() = true                                    │
│    → Overlay visible                                          │
│                                                               │
│  During Victory (8 seconds):                                   │
│    All rendering functions check:                             │
│      if (victoryOverlay.hasOwnership()) return;               │
│    → Screen changes blocked                                   │
│    → State updates blocked                                    │
│    → Only overlay is visible                                  │
│                                                               │
│  Game Reset:                                                  │
│    victoryOverlay.hide()                                     │
│    → hasOwnership() = false                                   │
│    → Normal rendering resumes                                 │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Race Condition Prevention

### Problem: Multiple events arrive simultaneously

```
Timeline:
  t=0ms:  'phaseChange' arrives
  t=5ms:  'victory' arrives
  t=10ms: 'state' update arrives
```

### Solution: Ownership flag prevents conflicts

```javascript
// t=0ms: phaseChange handler
socket.on('phaseChange', ({ phase }) => {
  if (!victoryOverlay.hasOwnership()) {  // false at t=0ms
    screens.show(phase);  // Executes
  }
});

// t=5ms: victory handler
socket.on('victory', ({ winnerName }) => {
  victoryOverlay.show(winnerName);  // Sets ownership = true
});

// t=10ms: state update tries to render
function renderLobby() {
  if (victoryOverlay.hasOwnership()) {  // true at t=10ms
    return;  // BLOCKED - overlay owns UI
  }
  // ... render
}
```

## Key Design Decisions

### 1. Server Controls Timing
**Why:** Client timers can drift, disconnect, or be manipulated
**How:** Server uses `setTimeout` and emits `gameReset` after 8 seconds

### 2. Ownership Flag Pattern
**Why:** Prevents any UI from overriding victory overlay
**How:** `hasUIOwnership` boolean flag checked before all rendering

### 3. Separate Overlay from Screen State
**Why:** Overlay can be visible regardless of current screen
**How:** Two independent state systems that don't interfere

### 4. Single Victory Event
**Why:** Prevents duplicate overlays or race conditions
**How:** Server emits `victory` exactly once, client handles once

### 5. Phase Change Protection
**Why:** `phaseChange` events shouldn't override victory overlay
**How:** Check ownership before executing phase change handler

## Testing Checklist

- [ ] Victory overlay appears immediately when winner declared
- [ ] Victory overlay cannot be hidden by screen changes
- [ ] Victory overlay cannot be hidden by state updates
- [ ] Victory overlay stays visible for exactly 8 seconds
- [ ] After 8 seconds, automatically returns to lobby
- [ ] No manual button press required
- [ ] Works with multiple players
- [ ] Works with reconnects (server re-emits victory if needed)
- [ ] No race conditions with rapid socket events

