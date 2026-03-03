# 🎮 Rankly

A real-time multiplayer party game where players compete by answering creative questions. One player acts as the judge each round, ranking answers to award points. Built with Node.js, Express, and Socket.IO.

## ✨ Features

### 🎯 Core Gameplay
- **Multiplayer Rooms**: Create or join game rooms with unique 6-character codes
- **Turn-Based Answering**: Players take turns submitting answers within a time limit
- **Rotating Judge System**: Fair judge rotation with bonus points for judging
- **Multiple Game Modes**: Standard (built-in questions) or Custom (your own questions)
- **Configurable Rounds**: 5-20 rounds with progressive difficulty
- **Real-Time Scoring**: Live leaderboard updates after each round
- **Winner Ceremony**: Podium display with top 3 players at game end

### 🎨 User Experience
- **Avatar Customization**: Personalize your avatar with custom colors and text colors
- **Sound Effects**: Immersive audio feedback for actions (with toggle to disable)
- **Settings Modal**: Control sound effects and other preferences
- **Responsive Design**: Clean, modern UI with smooth animations
- **Chat System**: In-game chat with anti-spam protection (disabled during rounds)
- **Onboarding Tooltips**: First-time player guidance

### 🔄 Reconnection System
- **Automatic Reconnection**: Players can refresh their browser and rejoin seamlessly
- **60-Second Grace Period**: Disconnected players have time to reconnect
- **State Restoration**: Game state, scores, and progress are preserved
- **Judge Reconnection**: Judges can reconnect during ranking phase
- **Host Reconnection**: Host privileges are maintained after reconnection

### 🎛️ Host Controls
- **Game Configuration**: Set minimum players (3-8), turn time (15-60s), point multiplier (1-3x), and rounds (5-20)
- **Player Management**: Kick players, reshuffle turn order
- **Game Flow Control**: Start game, advance rounds, end game early
- **Custom Questions**: Add your own questions in Custom mode (5 questions required)
- **Room Management**: Close room for all players

### 🎲 Question System
- **Built-in Question Pool**: Curated questions with difficulty levels (Easy, Medium, Hard)
- **Custom Question Mode**: Host can provide their own questions
- **Difficulty Progression**: Questions get harder as the game progresses
- **Admin API**: Add new questions to the pool via REST endpoint

### 🛡️ Safety & Validation
- **Duplicate Answer Prevention**: No two players can submit the same answer
- **Similarity Detection**: Visual indicators for similar answers during ranking
- **Turn Timeout Handling**: Auto-submit "(No Answer)" if time runs out
- **Minimum Player Enforcement**: Game ends if players drop below minimum
- **Anti-Spam Protection**: Chat rate limiting (500ms cooldown)
- **Input Validation**: Answer length limits, question validation

### 🎵 Audio Features
- **Button Click Sounds**: Soft UI feedback for all interactions
- **Round Start Sound**: Whoosh + impact when new questions appear
- **Ranking Reveal Sound**: Rising tone when results are shown
- **Victory Fanfare**: Celebration sound when game ends normally
- **Game Ended Sound**: Descending tone for unexpected endings
- **Global Sound Toggle**: Disable all sounds via settings

### 📊 Advanced Features
- **Phase-Driven Architecture**: Clean state management (Answering → Ranking → Results)
- **Auto-Ranking**: Judges who don't rank in time get random rankings
- **Judge Reassignment**: Automatic judge replacement if judge disconnects permanently
- **Round Skipping**: Skip rounds if judge leaves during ranking
- **Between-Rounds Timer**: 15-second auto-advance to next round
- **Return to Lobby**: 30-second timer after game ends
- **Ready System**: Players mark themselves ready before game starts

## �️ Project Structure

```
rankly/
├── server.js                    # Main server entry point
├── server/
│   ├── index.js                 # Socket.IO event handlers
│   ├── gameEngine.js            # Core game logic and round management
│   ├── rankingService.js        # Ranking phase and scoring
│   ├── reconnectService.js      # Player reconnection handling
│   ├── roomManager.js           # Room state and player management
│   ├── questionService.js       # Question selection and management
│   ├── adminRoutes.js           # Admin API endpoints
│   ├── config.js                # Game constants and configuration
│   └── utils.js                 # Utility functions
├── public/
│   ├── index.html               # Main game interface
│   ├── client.js                # Client-side game logic
│   ├── theme.css                # Color scheme and variables
│   ├── layout.css               # Page structure and grid
│   ├── components.css           # UI component styles
│   └── polish.css               # Animations and effects
├── data/
│   └── questions.json           # Question database
└── package.json                 # Dependencies and scripts
```

## 🚀 Quick Start

### Prerequisites
- Node.js v14 or higher
- npm (comes with Node.js)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd rankly

# Install dependencies
npm install

# Start the server
node server.js
```

The game will be available at `http://localhost:3000`

### Custom Port

```bash
PORT=8080 node server.js
```

## 🎯 How to Play

### Creating a Game

1. **Enter Your Name**: Type your name in the input field
2. **Choose Game Mode**:
   - **Standard**: Uses built-in questions
   - **Custom**: Provide your own 5 questions
3. **Create Room**: Click "Create Room" to generate a room code
4. **Configure Settings**:
   - Minimum Players: 3-8
   - Turn Time: 15-60 seconds
   - Point Multiplier: 1x-3x
   - Number of Rounds: 5-20
5. **Share Room Code**: Give the code to other players
6. **Start Game**: Click "Start Game" when ready

### Joining a Game

1. **Enter Your Name**: Type your name
2. **Enter Room Code**: Input the 6-character code
3. **Join Room**: Click "Join Room"
4. **Mark Ready**: Click "Ready" when prepared
5. **Wait for Start**: Host will start the game

### During the Game

#### As a Player (Non-Judge)
1. **Wait for Your Turn**: Watch the turn order
2. **Answer the Question**: Type your creative answer when it's your turn
3. **Submit Before Time Runs Out**: You have 15-60 seconds (configured by host)
4. **Wait for Ranking**: Judge will rank all answers
5. **View Results**: See your score and ranking

#### As the Judge
1. **Watch Players Answer**: You cannot answer this round
2. **Rank the Answers**: Drag or select rankings from best (1) to worst
3. **Submit Rankings**: Click "Submit" before time runs out (60 seconds)
4. **Earn Bonus Points**: Receive 5 bonus points for judging

### Scoring

- **Points Formula**: `(Total Answers - Your Rank + 1) × 10 × Multiplier`
- **Example**: If 4 players answered and you ranked 2nd with 2x multiplier:
  - Points = (4 - 2 + 1) × 10 × 2 = 60 points
- **Judge Bonus**: +5 points per round judged
- **No Answer**: 0 points if you don't submit in time

## ⚙️ Configuration

### Game Rules (Host Only)

| Setting | Options | Default |
|---------|---------|---------|
| Minimum Players | 3-8 | 3 |
| Turn Time | 15s, 30s, 45s, 60s | 45s |
| Point Multiplier | 1x, 2x, 3x | 1x |
| Number of Rounds | 5-20 | 5 |

### Question Difficulty Distribution

- **First 40%**: Easy questions
- **Next 35%**: Medium questions  
- **Final 25%**: Hard questions

## 🔧 Admin API

Add questions to the pool programmatically:

**Endpoint**: `POST /admin/add-question`

**Headers**:
```
Content-Type: application/json
x-admin-token: <your-admin-token>
```

**Body**:
```json
{
  "text": "Name something people do on weekends.",
  "difficulty": "medium"
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/admin/add-question \
  -H "Content-Type: application/json" \
  -H "x-admin-token: local-dev-token" \
  -d '{"text": "Name a place people visit on vacation.", "difficulty": "easy"}'
```

**Environment Variable**: Set `ADMIN_TOKEN` (default: `"local-dev-token"`)

## 🎨 Customization

### Avatar Colors
- Click the 🎨 button in the header
- Choose your avatar background color
- Choose your text color
- Preview and save

### Sound Settings
- Click the ⚙ button in the header
- Toggle "Sound Effects" on/off
- Setting is saved to your browser

## 🛠️ Technologies

- **Backend**: Node.js, Express.js
- **Real-Time**: Socket.IO
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Audio**: Web Audio API
- **IDs**: nanoid
- **Fonts**: Google Fonts (Baloo 2)

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <process-id> /F

# Kill process on port 3000 (Mac/Linux)
lsof -ti:3000 | xargs kill -9
```

### Questions Not Loading
- Verify `data/questions.json` exists
- Check JSON syntax is valid
- Ensure file has read permissions

### Reconnection Issues
- Hard refresh browser (Ctrl+Shift+R)
- Clear browser cache
- Check browser console for errors

### Sound Not Working
- Check browser allows audio
- Verify sound toggle is enabled in settings
- Try clicking a button to initialize audio context

## 📝 Game States

The game progresses through these states:

1. **Lobby**: Players join and get ready
2. **Starting**: 60-second countdown before game begins
3. **In Round**: Active gameplay
   - **Answering Phase**: Players take turns answering
   - **Ranking Phase**: Judge ranks all answers
   - **Results Phase**: Scores are revealed
4. **Between Rounds**: 15-second break before next round
5. **Game Ended**: Final leaderboard and winner ceremony

## 🎭 Game Modes

### Standard Mode
- Uses built-in question pool
- Questions selected based on difficulty progression
- No setup required

### Custom Mode
- Host provides 5 custom questions
- Questions must be unique
- All questions used in order
- Perfect for themed games

## 🏆 Winning

- Player with highest score after all rounds wins
- Top 3 players shown on podium
- Confetti animation for winner
- Full leaderboard displayed

## 📄 License

ISC

## 👥 Contributing

This is a group project. For contributions or issues, please contact the development team.

---

**Minimum Requirements**: 3 players, modern web browser with JavaScript enabled

**Recommended**: 4-6 players for best experience

**Note**: All players must be connected to the same network or have access to the server URL.
