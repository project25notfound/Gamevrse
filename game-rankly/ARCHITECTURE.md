# Architecture Diagram

## Module Dependency Graph

```
┌─────────────────────────────────────────────────────────────────┐
│                         index.js                                 │
│                    (Main Entry Point)                            │
│  - Express & Socket.IO setup                                     │
│  - Socket event handlers                                         │
│  - Shared state (rooms, chatTimestamps)                          │
│  - Dependency injection wrappers                                 │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ imports & uses
             │
    ┌────────┴────────┬──────────┬──────────┬──────────┬──────────┐
    │                 │          │          │          │          │
    ▼                 ▼          ▼          ▼          ▼          ▼
┌────────┐    ┌──────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐
│ config │    │ question │  │  room  │  │countdown│  │  game  │  │ranking │
│        │    │ Service  │  │Manager │  │Service │  │ Engine │  │Service │
└────────┘    └──────────┘  └────────┘  └────────┘  └────────┘  └────────┘
                    │            │           │           │           │
                    │            │           │           │           │
                    └────────────┴───────────┴───────────┴───────────┘
                                         │
                                         │ uses
                                         ▼
                                    ┌────────┐
                                    │ utils  │
                                    │(shuffle)│
                                    └────────┘

    ┌──────────────────────────────────────────────────────────────┐
    │                                                              │
    ▼                                                              ▼
┌────────────┐                                              ┌────────────┐
│ reconnect  │                                              │   admin    │
│  Service   │                                              │   Routes   │
└────────────┘                                              └────────────┘
```

## Data Flow

### Room Creation Flow
```
Client
  │
  │ create_room
  ▼
index.js
  │
  │ creates room object
  │ assigns playerToken
  ▼
rooms[roomId]
  │
  │ broadcastRoom()
  ▼
roomManager.broadcastRoom()
  │
  │ emit room_update
  ▼
All clients in room
```

### Game Start Flow
```
Host Client
  │
  │ start_game
  ▼
index.js
  │
  │ validate mode
  ▼
questionService.validateCustomQuestions() [if custom mode]
  │
  │ OR
  ▼
questionService.prepareRoomQuestions() [if normal mode]
  │
  │ questions ready
  ▼
countdownService.beginStartCountdown()
  │
  │ emit start_countdown
  │ start 60s timer
  ▼
Players ready up
  │
  │ all ready?
  ▼
gameEngine.startRoundNow()
  │
  │ pick judge
  │ create turn order
  │ emit game_started
  ▼
gameEngine.beginNextTurn()
```

### Turn Flow
```
gameEngine.beginNextTurn()
  │
  │ emit next_turn
  │ emit your_turn (to current player)
  │ start turn timer
  ▼
Player submits answer
  │
  │ submit_answer
  ▼
index.js
  │
  │ validate answer
  │ check duplicates
  │ add to round.answers
  ▼
gameEngine.beginNextTurn() [recursive]
  │
  │ all answered?
  ▼
emit enter_ranking
```

### Ranking Flow
```
Judge
  │
  │ submit_rank
  ▼
index.js
  │
  │ validate judge
  ▼
rankingService.submitRank()
  │
  │ separate valid/timed-out
  │ calculate points
  │ award judge bonus
  │ build leaderboard
  │ emit ranking_result
  ▼
Check if game over
  │
  ├─ Yes: emit game_ended
  │        start 30s auto-return timer
  │
  └─ No:  room.state = "between_rounds"
          room.currentRoundIndex++
          start 15s auto-advance timer
          │
          │ timer expires
          ▼
          gameEngine.startRoundNow() [next round]
```

### Disconnect/Reconnect Flow
```
Client disconnects
  │
  │ disconnect event
  ▼
reconnectService.handleDisconnect()
  │
  │ mark player.connected = false
  │ start 30s grace timer
  │ emit player_disconnected
  ▼
Grace period (30s)
  │
  ├─ Client reconnects
  │    │
  │    │ attempt_reconnect
  │    ▼
  │  reconnectService.attemptReconnect()
  │    │
  │    │ validate playerToken
  │    │ clear grace timer
  │    │ migrate socket ID
  │    │ update turn order
  │    │ emit player_reconnected
  │    │ send reconnect_state snapshot
  │    ▼
  │  Client rehydrates UI
  │
  └─ Timer expires
       │
       ▼
     reconnectService.handlePermanentDisconnect()
       │
       │ remove player
       │ promote host if needed
       │ reassign judge if needed
       │ clean turn order
       │ emit player_permanently_disconnected
       ▼
     Check minimum players
       │
       ├─ Too few: end game
       └─ OK: continue
```

## Shared State Management

### The `rooms` Object
```javascript
rooms = {
  [roomId]: {
    players: {
      [socketId]: {
        socketId, name, score, ready,
        avatarColor, avatarTextColor,
        playerToken, connected,
        disconnectedAt, _graceTimer
      }
    },
    hostSocketId,
    judgeSocketId,
    judgeQueue: [],
    state: "lobby" | "starting" | "in_round" | "between_rounds",
    leaderboard: [],
    rules: { minPlayers, turnTime, multiplier, numRounds },
    round: {
      id, question, difficulty,
      answers: [], turnOrder: [],
      currentTurnIndex
    },
    pendingQuestion,
    _startTimer,
    startExpiresAt,
    customQuestions: [],
    questions: [],
    currentRoundIndex,
    mode: "normal" | "custom",
    usedQuestionTexts: Set,
    _turnTimer,
    _turnStartedAt,
    _nextRoundTimer,
    _autoReturnTimer
  }
}
```

### Dependency Injection Pattern
```javascript
// In index.js
const rooms = {};
const io = new Server(server);

// Wrapper functions inject dependencies
const wrappedBroadcastRoom = (roomId) => 
  broadcastRoom(roomId, rooms, io);

const wrappedBeginNextTurn = (roomId) => 
  beginNextTurn(roomId, rooms, io);

const wrappedStartRoundNow = (roomId) => 
  startRoundNow(roomId, rooms, io, wrappedBeginNextTurn);

// Services remain pure
export function broadcastRoom(roomId, rooms, io) {
  const room = rooms[roomId];
  // ... logic
  io.to(roomId).emit("room_update", data);
}
```

## Module Interactions

### questionService
- **Used by**: index.js
- **Uses**: config.js, utils.js
- **Responsibilities**: Load, validate, prepare questions

### roomManager
- **Used by**: index.js, gameEngine, reconnectService, rankingService
- **Uses**: utils.js
- **Responsibilities**: Room state, player management, broadcasting

### countdownService
- **Used by**: index.js, reconnectService
- **Uses**: roomManager
- **Responsibilities**: Start countdown, auto-start logic

### gameEngine
- **Used by**: index.js, countdownService, reconnectService
- **Uses**: roomManager, utils.js
- **Responsibilities**: Round lifecycle, turn progression

### rankingService
- **Used by**: index.js
- **Uses**: config.js, roomManager
- **Responsibilities**: Scoring, leaderboard, round progression

### reconnectService
- **Used by**: index.js
- **Uses**: config.js, roomManager, gameEngine, countdownService
- **Responsibilities**: Disconnect handling, reconnection

### adminRoutes
- **Used by**: index.js
- **Uses**: config.js, questionService
- **Responsibilities**: Admin API endpoints

## State Machine

```
┌─────────┐
│  lobby  │◄─────────────────────────────────────┐
└────┬────┘                                      │
     │                                           │
     │ start_game                                │
     ▼                                           │
┌──────────┐                                     │
│ starting │                                     │
│ (60s)    │                                     │
└────┬─────┘                                     │
     │                                           │
     │ all ready OR timeout                      │
     ▼                                           │
┌──────────┐                                     │
│ in_round │                                     │
│          │                                     │
└────┬─────┘                                     │
     │                                           │
     │ all answered + ranked                     │
     ▼                                           │
┌────────────────┐                               │
│ between_rounds │                               │
│    (15s)       │                               │
└────┬───────────┘                               │
     │                                           │
     ├─ more rounds? ──► startRoundNow() ────────┤
     │                                           │
     └─ game over ──────────────────────────────┘
```

## Critical Paths

### 1. Custom Question Validation
```
Client → index.js → questionService.validateCustomQuestions()
  ├─ Type check
  ├─ Length check (5-120)
  ├─ Duplicate check
  ├─ Injection protection
  └─ Count validation
```

### 2. Judge Reassignment
```
Judge disconnects → reconnectService.handlePermanentDisconnect()
  → roomManager.reassignJudge()
    → roomManager.pickJudge()
      → emit judge_reassigned
```

### 3. Low-Player Termination
```
Player leaves → countConnectedPlayers() < minPlayers
  → resetAllPlayersReadyState()
  → emit game_ended_due_to_low_players
  → emit return_to_lobby
  → broadcastRoom()
```

## Timer Management

### Timers in System
1. `room._startTimer` - 60s countdown before game starts
2. `room._turnTimer` - Per-turn timeout (default 45s)
3. `room._nextRoundTimer` - 15s auto-advance between rounds
4. `room._autoReturnTimer` - 30s auto-return after game ends
5. `player._graceTimer` - 30s grace period for reconnection

### Timer Cleanup
All timers are properly cleaned up on:
- Room deletion
- State transitions
- Player disconnect
- Host actions (cancel, end game)
