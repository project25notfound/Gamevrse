# ♠ Blackjack Roulette ♦

A thrilling multiplayer elimination game that combines Blackjack strategy with Russian Roulette tension. Play cards, survive rounds, and be the last player standing!

## 🎮 Game Overview

Blackjack Roulette is a unique multiplayer game where 2-6 players compete in rounds of Blackjack. After each round, the player with the worst hand faces elimination through a deadly roulette spin. The last player alive wins!

### Key Features

- **Multiplayer Rooms**: Create or join rooms with up to 6 players
- **Two Elimination Modes**: Standard (busted players prioritized) or Lowest-Hand (always lowest hand)
- **Second Chance Cards**: One-time use cards to guarantee survival
- **Practice Mode**: Play against AI bots with adjustable difficulty
- **Interactive Tutorial**: Learn the game mechanics step-by-step
- **Spectator System**: Watch ongoing games and join the next round
- **Real-time Gameplay**: WebSocket-based multiplayer with instant updates
- **Mobile Responsive**: Play on desktop, tablet, or mobile devices

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd blackjack-roulette
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## 🎯 How to Play

### Game Setup

1. **Enter Your Name**: Choose a display name (max 15 characters)
2. **Create or Join Room**: 
   - Create a new room and share the 4-letter code
   - Or join an existing room with a code
3. **Wait for Players**: Minimum 2 players required
4. **Host Starts**: The room creator starts the round

### Blackjack Phase

- **Goal**: Get as close to 21 as possible without going over
- **Card Values**: 
  - Number cards = Face value
  - Face cards (J, Q, K) = 10
  - Aces = 1 or 11 (automatically calculated)
- **Actions**:
  - **Hit**: Draw another card
  - **Stand**: Keep your current hand
- **Turn Timer**: 15 seconds per turn (auto-stand if time runs out)

### Elimination Phase

After all players stand or bust, one player is chosen for roulette:

#### Standard Mode (Default)
- **All Busted**: Random busted player chosen
- **Mixed Results**: Busted players chosen first
- **No Busts**: Player with lowest hand value chosen
- **Ties**: Random selection among tied players

#### Lowest-Hand Mode
- **Always**: Player with lowest hand value chosen
- **Bust Status**: Ignored for roulette selection
- **Final 2 Exception**: If one player busts, they go to roulette

### Roulette Phase

The chosen player makes two decisions:

1. **Risk Level**:
   - **Normal Risk**: Roll 1-6, eliminated on 1-2 (33% chance)
   - **Second Chance Card**: Guarantee survival (one-time use per game)

2. **Timing Style**:
   - **Instant**: Immediate trigger pull
   - **Dramatic**: 3-second chamber spinning animation

### Victory

The last player standing wins! After victory:
- 8-second celebration with confetti
- Automatic return to lobby
- Win counter updated

## 🎓 Game Modes

### Multiplayer Mode

Standard competitive gameplay with real players:
- Create or join rooms
- Host controls (start rounds, kick players, set elimination mode)
- Real-time chat via game log
- Spectator support for mid-game joiners

### Practice Mode

Solo training against AI bots:
- **Bot Count**: 1-5 bots
- **Difficulty Levels**:
  - **Easy**: Conservative play, simple decisions
  - **Normal**: Balanced strategy
  - **Hard**: Aggressive, strategic play
- **Elimination Mode**: Choose Standard or Lowest-Hand
- **Safe Mode**: Reduced sound effects and animations
- **Instant Restart**: No waiting for other players

### Tutorial Mode

Interactive 3-phase tutorial:
- **Phase 1**: Blackjack basics (hitting, standing, busting)
- **Phase 2**: Elimination logic and roulette mechanics
- **Phase 3**: Advanced rules (game modes, Second Chance Cards, Final 2)

## 🎨 Features

### Host Controls

Room creators have special privileges:
- **Start Rounds**: Control when games begin
- **Elimination Mode**: Switch between Standard and Lowest-Hand (lobby only)
- **Kick Players**: Remove disruptive players (lobby only)
- **Ban System**: Kicked players cannot rejoin the same room

### Spectator Features

Players who join mid-game become spectators:
- **Full Visibility**: See all game logs and round summaries
- **Emoji Reactions**: Send reactions during gameplay (😱 🙏 💀 🍀 😬 🔥)
- **Join Next Game**: Button to rejoin as active player
- **Compact Banner**: Unobtrusive spectator indicator

### Second Chance Card System

Strategic survival mechanic:
- **Starting Cards**: Every player gets 1 card per game
- **Usage**: Choose during roulette selection to avoid elimination
- **Effect**: Guarantees survival regardless of dice roll
- **Limitations**: One-time use, consumed immediately
- **Visual Indicator**: 🃏 icon on player card when available

### Final 2 Showdown

Special atmosphere when only 2 players remain:
- **Dramatic Effects**: Enhanced lighting and sound
- **Slower Animations**: Increased tension
- **Special Rule**: If one player busts, they go to roulette (overrides mode)
- **Victory Reveal**: Dramatic pause before winner announcement

### Audio System

Immersive sound design:
- **Game Sounds**: Click, hit, stand, gun, death
- **Synthetic Effects**: Tension, victory fanfare, elimination
- **Mute Control**: Toggle sound on/off from intro screen
- **Safe Mode**: Reduced violent sound effects
- **Persistent Settings**: Mute preference saved in localStorage

## 🛠️ Technical Stack

### Backend
- **Node.js**: Server runtime
- **Express**: Web server framework
- **Socket.IO**: Real-time WebSocket communication
- **In-Memory Storage**: Room and player state management

### Frontend
- **Vanilla JavaScript**: No framework dependencies
- **ES6 Modules**: Modern JavaScript architecture
- **CSS3**: Advanced animations and effects
- **Web Audio API**: Synthetic sound generation
- **LocalStorage**: Settings persistence

### Architecture

```
blackjack-roulette/
├── server.js                 # Main server and game logic
├── public/
│   ├── index.html           # Main HTML structure
│   ├── style.css            # Complete styling
│   ├── sounds/              # Audio files
│   └── js/
│       └── client/
│           ├── index.js     # Main client logic
│           ├── state.js     # Client state management
│           └── ui/
│               ├── audio.js              # Audio system
│               ├── focusTrap.js          # Accessibility
│               ├── overlays.js           # Notification system
│               ├── practiceMode.js       # Bot gameplay
│               ├── renderLobby.js        # Lobby UI
│               ├── renderPlayers.js      # Player cards
│               ├── rouletteChoice.js     # Roulette modal
│               ├── screens.js            # Screen management
│               ├── spectatorFeatures.js  # Spectator UI
│               ├── tutorialMode.js       # Tutorial system
│               └── victoryOverlay.js     # Victory screen
├── reference-implementation/ # Original implementation
├── TESTING_CHECKLIST.md     # QA checklist
├── GAME_AUDIT_REPORT.md     # Feature audit
└── README.md                # This file
```

## 🎮 Controls

### Keyboard Shortcuts

- **Enter/Space**: Confirm actions in modals
- **Escape**: Close overlays and modals
- **1**: Select Normal Risk (in roulette modal)
- **2**: Select Second Chance Card (in roulette modal, if available)

### Mouse/Touch

- Click/tap buttons for all actions
- Fully responsive touch interface for mobile devices

## 🔧 Configuration

### Server Configuration

Edit `server.js` to customize:

```javascript
const PORT = process.env.PORT || 3000;  // Server port
const TURN_DURATION = 15000;            // Turn timer (ms)
const ROULETTE_TIMEOUT = 30000;         // Roulette choice timer (ms)
const ELIM_THRESHOLD = 2;               // Elimination threshold (1-2 = death)
```

### Game Rules

Modify elimination logic in `server.js`:
- `selectRoulettePlayer()`: Roulette selection logic
- `executeRouletteResult()`: Dice roll and elimination
- `getBotDecision()`: AI bot strategy

## 🐛 Known Issues

### Fixed Issues
- ✅ Final 2 disconnect victory detection
- ✅ Roulette timer cleanup on disconnect
- ✅ Victory overlay z-index conflicts
- ✅ Double scrollbar in game screen
- ✅ Tutorial Phase 1 interactivity

### Pending Testing
- ⚠️ Host disconnection during active games (needs stress testing)
- ⚠️ Network interruption handling (needs real-world testing)
- ⚠️ Mobile touch interactions (needs device testing)

## 📝 Development

### Running in Development

```bash
# Start server with auto-reload (if using nodemon)
npm run dev

# Or standard start
npm start
```

### Testing

See `TESTING_CHECKLIST.md` for comprehensive testing procedures.

### Code Style

- ES6+ JavaScript
- Modular architecture
- Extensive comments
- Consistent naming conventions

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

[Add your license here]

## 🙏 Acknowledgments

- Socket.IO for real-time communication
- Web Audio API for synthetic sounds
- All playtesters and contributors

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check `TESTING_CHECKLIST.md` for known issues
- Review `GAME_AUDIT_REPORT.md` for feature details

---

**Enjoy the game and may the odds be ever in your favor!** 🎲🃏
