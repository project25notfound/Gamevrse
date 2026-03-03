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

// Serve static files from public directory (homepage)
app.use(express.static(path.join(__dirname, "public")));

// Serve Blackjack game files
app.use('/blackjack', express.static(path.join(__dirname, 'game-blackjack/public')));

// Route for Blackjack game
app.get('/blackjack', (req, res) => {
  res.sendFile(path.join(__dirname, 'game-blackjack/public', 'index.html'));
});

const server = http.createServer(app);
const io = new Server(server);

// =============================================================
// BLACKJACK GAME LOGIC (Namespace: /blackjack)
// =============================================================
const blackjackNamespace = io.of('/blackjack');

// Import Blackjack game state and logic
const blackjackPlayers = {};
const blackjackRooms = {};
let blackjackDeck = [];

// Blackjack helper functions
function createDeck() {
  const suits = ['♠', '♥', '♦', '♣'];
  const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck = [];
  for (let suit of suits) {
    for (let value of values) {
      deck.push({ suit, value });
    }
  }
  return shuffleDeck(deck);
}

function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function handValue(hand) {
  let value = 0;
  let aces = 0;
  
  for (let card of hand) {
    if (card.value === 'A') {
      aces++;
      value += 11;
    } else if (['J', 'Q', 'K'].includes(card.value)) {
      value += 10;
    } else {
      value += parseInt(card.value);
    }
  }
  
  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }
  
  return value;
}

// Blackjack socket handlers
blackjackNamespace.on('connection', (socket) => {
  console.log('[Blackjack] Player connected:', socket.id);
  
  socket.on('joinGame', ({ name, roomCode }) => {
    if (!blackjackRooms[roomCode]) {
      blackjackRooms[roomCode] = {
        players: {},
        deck: createDeck(),
        dealer: { hand: [] },
        gameStarted: false,
        currentTurn: null
      };
    }
    
    const room = blackjackRooms[roomCode];
    room.players[socket.id] = {
      id: socket.id,
      name: name || `Player ${Object.keys(room.players).length + 1}`,
      hand: [],
      bet: 0,
      chips: 1000,
      busted: false,
      standing: false
    };
    
    socket.join(roomCode);
    socket.emit('joined', { roomCode, playerId: socket.id });
    blackjackNamespace.to(roomCode).emit('playerList', Object.values(room.players));
  });
  
  socket.on('startGame', ({ roomCode }) => {
    const room = blackjackRooms[roomCode];
    if (!room || room.gameStarted) return;
    
    room.gameStarted = true;
    room.deck = createDeck();
    
    // Deal initial cards
    for (let player of Object.values(room.players)) {
      player.hand = [room.deck.pop(), room.deck.pop()];
      player.busted = false;
      player.standing = false;
    }
    
    room.dealer.hand = [room.deck.pop(), room.deck.pop()];
    
    blackjackNamespace.to(roomCode).emit('gameStarted', {
      players: Object.values(room.players),
      dealer: { hand: [room.dealer.hand[0], { hidden: true }] }
    });
  });
  
  socket.on('hit', ({ roomCode }) => {
    const room = blackjackRooms[roomCode];
    if (!room) return;
    
    const player = room.players[socket.id];
    if (!player || player.busted || player.standing) return;
    
    player.hand.push(room.deck.pop());
    const value = handValue(player.hand);
    
    if (value > 21) {
      player.busted = true;
    }
    
    blackjackNamespace.to(roomCode).emit('playerUpdate', {
      playerId: socket.id,
      hand: player.hand,
      busted: player.busted
    });
  });
  
  socket.on('stand', ({ roomCode }) => {
    const room = blackjackRooms[roomCode];
    if (!room) return;
    
    const player = room.players[socket.id];
    if (!player) return;
    
    player.standing = true;
    
    blackjackNamespace.to(roomCode).emit('playerUpdate', {
      playerId: socket.id,
      standing: true
    });
  });
  
  socket.on('disconnect', () => {
    console.log('[Blackjack] Player disconnected:', socket.id);
    
    // Clean up player from all rooms
    for (let roomCode in blackjackRooms) {
      const room = blackjackRooms[roomCode];
      if (room.players[socket.id]) {
        delete room.players[socket.id];
        blackjackNamespace.to(roomCode).emit('playerList', Object.values(room.players));
        
        // Delete empty rooms
        if (Object.keys(room.players).length === 0) {
          delete blackjackRooms[roomCode];
        }
      }
    }
  });
});

// =============================================================
// START SERVER
// =============================================================
server.listen(PORT, () => {
  console.log(`
========================================
🎮 Gamevrse Server 1
========================================
Server running at http://localhost:${PORT}
Games Available:
  - Homepage (/)
  - Blackjack (/blackjack)
========================================
  `);
});
