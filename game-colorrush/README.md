# ColorRush 🎮

A real-time multiplayer memory game built with Node.js, Express, and Socket.IO. Test your memory and compete against friends in this fast-paced color sequence challenge!

## 🎯 Game Overview

ColorRush is a multiplayer Simon-style memory game where players watch increasingly complex color sequences and must repeat them correctly. The last player standing wins, or compete for the highest score across multiple rounds.

### Key Features

- **Real-time Multiplayer**: Up to 6 players per room
- **Dynamic Game Modes**: Normal rounds and intense 1v1 Sudden Death
- **Power-Ups System**: Second Chance, Freeze Timer, and Pattern Peek
- **Spectator Mode**: Watch the action after elimination
- **Customizable Rooms**: Configure max players, rounds, and power-ups
- **Responsive UI**: Modern, accessible interface with animations
- **Practice Mode**: Hone your skills solo before competing

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd simon404

# Install dependencies
npm install

# Start the server
node server.js
```

The game will be available at `http://localhost:3000`

### Dependencies

- **express** (^5.1.0) - Web server framework
- **socket.io** (^4.8.1) - Real-time bidirectional communication

## 🎮 How to Play

### Basic Rules

1. **Watch** the color and sound sequence carefully
2. **Remember** the pattern - it gets longer each round
3. **Repeat** by clicking buttons in correct order (or use keyboard 1-4)
4. You have **30 seconds** per round to submit your answer
5. Start with **2 lives** - lose one for each mistake or timeout

### Game Modes

#### Normal Mode
- Players compete through progressively harder rounds
- Lose lives for mistakes or timeouts
- Last player standing wins, or highest score after max rounds

#### Sudden Death (1v1 Only)
- Triggers when exactly 2 players both fail in the same round
- Both players revive with 1 life for a final showdown
- Fixed 5-tile sequence challenge
- If both fail, sudden death continues (no draw)

### Power-Ups

When enabled, players can use strategic power-ups:

- **Second Chance** ⚡ - Replay the sequence once per game after a wrong answer
- **Freeze** ❄️ - Pause your timer for 3 seconds (once per round)
- **Pattern Peek** 👁️ - Reveal the sequence during play phase (once per game)

### Game End Scenarios

- **Normal Victory**: Last player standing or highest score after max rounds
- **DRAW (3+ players)**: All remaining players lose their last life in the same round
- **1v1 Sudden Death**: Exactly 2 players both fail in the same round

## 🏗️ Project Structure

```
simon404/
├── server.js              # Main server and game logic
├── rooms.js               # Room management module
├── package.json           # Project dependencies
├── public/
│   ├── index.html        # Main HTML structure
│   ├── client.js         # Client-side game logic
│   ├── modal.js          # Modal UI handlers
│   └── style.css         # Styles and animations
└── node_modules/         # Dependencies
```

## 🎨 Features in Detail

### Room System
- **Create Room**: Host creates a room with custom settings
- **Join Room**: Players join using 6-character room codes
- **Lobby System**: Ready-up system with countdown
- **Host Controls**: Kick players, adjust settings, start game

### Lobby Features
- **Ready System**: Non-host players ready up before game starts
- **Smart Countdown**: 30-second countdown with intelligent start logic
- **Quick Tips**: Rotating gameplay tips in lobby
- **Settings Panel**: Host can adjust max players, rounds, and power-ups

### Game Phases
1. **GET_READY**: Brief preparation phase before sequence
2. **SEQUENCE**: Watch and memorize the color pattern
3. **PLAY**: Input your answer within the time limit
4. **ROUND_END**: See results and prepare for next round

### Scoring System
- Base points for correct sequences
- Bonus points for speed
- Combo multipliers for consecutive correct answers
- Sudden death bonus points

### Spectator Experience
- Live scoreboard updates
- See current round and sequence length
- Watch remaining players compete
- Rematch option after game ends

## 🔧 Configuration

### Room Settings (Host)
- **Max Players**: 2-6 players
- **Max Rounds**: 15-30 rounds
- **Power-Ups**: Enable/disable power-up system
- **Privacy**: Private rooms (default)

### Server Configuration
Edit `server.js` constants:
```javascript
const PORT = 3000;                    // Server port
const COUNTDOWN_DURATION = 30000;     // Lobby countdown (ms)
const GET_READY_DURATION = 3000;      // Get ready phase (ms)
const ROUND_END_DURATION = 3000;      // Round end phase (ms)
```

## 🎯 Game Logic Highlights

### Elimination System
- Players start with 2 lives
- Lose 1 life for wrong answer or timeout
- Eliminated when lives reach 0
- Special revival in 1v1 sudden death

### Sudden Death Logic
- Only triggers with exactly 2 players
- Both players must fail in the same round
- Fixed 5-tile sequence for fairness
- Continues until one player succeeds

### Draw Conditions
- 3+ players all lose last life in same round
- No winner declared
- Game ends immediately

### Timer System
- 30-second play phase timer
- Freeze power-up pauses timer
- Second Chance pauses timer during replay
- Auto-submit on timeout

## 🌐 Socket Events

### Client → Server
- `createRoom` - Create new game room
- `joinRoom` - Join existing room
- `leaveRoom` - Leave current room
- `startGame` - Host starts game
- `toggleReady` - Player ready toggle
- `submitSequence` - Submit answer
- `activateSecondChance` - Use Second Chance
- `activateFreeze` - Use Freeze
- `activatePatternPeek` - Use Pattern Peek

### Server → Client
- `roomCreated` - Room creation success
- `roomState` - Room state updates
- `gameStarting` - Countdown started
- `phaseChange` - Game phase transitions
- `showSequence` - Display sequence
- `playerEliminated` - Player elimination
- `gameOver` - Game end with results
- `suddenDeathStart` - Sudden death begins

## 🐛 Known Issues & Limitations

- Room codes are case-insensitive (normalized to uppercase)
- Maximum 6 players per room (configurable)
- No persistent storage (rooms reset on server restart)
- Single server instance (no clustering)

## 🔒 Security Considerations

- Input validation on all socket events
- Host-only actions verified server-side
- Room code normalization prevents case issues
- Player authentication via socket IDs
- No sensitive data stored

## 🚧 Future Enhancements

- [ ] Persistent leaderboards
- [ ] Player accounts and profiles
- [ ] Tournament mode
- [ ] Custom color themes
- [ ] Sound effect customization
- [ ] Replay system
- [ ] Mobile app version
- [ ] AI opponents for practice

## 📝 License

ISC

## 👥 Contributing

Contributions welcome! Please follow these guidelines:
1. Fork the repository
2. Create a feature branch
3. Test thoroughly (multiplayer scenarios)
4. Submit a pull request

## 🙏 Acknowledgments

Built with modern web technologies and inspired by the classic Simon memory game.

---

**Enjoy the game! May your memory be sharp and your reflexes quick! 🎮✨**
