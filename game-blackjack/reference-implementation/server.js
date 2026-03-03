const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const READY_COUNTDOWN_MS = 60000;
const ACTION_COOLDOWN_MS = 400;
const TURN_MS = 15000;
const TURN_EMIT_BUFFER_MS = 50;
const ELIM_THRESHOLD = 2;
const RECONNECT_WINDOW_MS = 60 * 1000;
const RETURN_TO_LOBBY_SECONDS = 8;
const NEXT_ROUND_COUNTDOWN_MS = 10000;


const rooms = {};
const playersByToken = {};

function makeToken() {
  return crypto.randomBytes(10).toString('hex');
}

function savePlayerToken(socket, token) {
  const roomCode = socket.data.roomCode;
  if (!roomCode || !token) return;

  const room = rooms[roomCode];
  if (!room) return;

  playersByToken[token] = {
    roomCode,
    player: { ...room.players[socket.id] },
    lastSeen: Date.now()
  };
}

function setPhase(roomCode, phase) {
  const room = rooms[roomCode];
  if (!room) return;

  room.phase = phase;

  io.to(roomCode).emit('phaseChange', {
    phase
  });
}




function createDeck() {
  const suits = ['♠','♥','♦','♣'];
  const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  return suits.flatMap(s => ranks.map(r => ({ rank: r, suit: s })));
}

function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function handValue(hand = []) {
  let total = 0, aces = 0;
  for (const c of hand) {
    if (c.rank === 'A') { aces++; total += 11; }
    else if (['K','Q','J'].includes(c.rank)) total += 10;
    else total += parseInt(c.rank, 10);
  }
  while (total > 21 && aces) { total -= 10; aces--; }
  return total;
}

function createRoom() {
  return {
    players: {},
    ownerId: null,
    deck: [],
    roundActive: false,
    currentPlayerOrder: [],
    turnIndex: 0,
    roundsPlayed: 0,
    phase: 'lobby',
    turnTimer: null,
    turnDeadline: null,
    endingRound: false,
    readyCountdownTimer: null,
    readyCountdownEndsAt: null,
    pendingElimination: null,
    winnerId: null,
    gameOver: false,
    triggerLocked: false,
    returningToLobby: false,
    nextRoundTimer: null,
    nextRoundEndsAt: null
  };
}


function reassignHost(room) {
  if (!room) return;

  // 1️⃣ Owner always wins if present
  const owner = room.players[room.ownerId];
  if (owner) {
    Object.values(room.players).forEach(p => (p.host = false));
    owner.host = true;
    return;
  }

  // 2️⃣ Fallback only if owner is gone
  const first = Object.values(room.players).find(p => !p.spectator);
  if (first) {
    Object.values(room.players).forEach(p => (p.host = false));
    first.host = true;
  }
}



function updateState(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;

  reassignHost(room);

const host = Object.values(room.players).find(p => p.host);


  io.to(roomCode).emit('state', {
    players: Object.values(room.players).map(p => ({
      id: p.id,
      name: p.name,
      hand: p.hand,
      alive: p.alive,
      busted: p.busted,
      stood: p.stood,
      host: p.host,
      wins: p.wins,
      spectator: p.spectator
    })),
    currentTurn: room.currentPlayerOrder[room.turnIndex] || null,
    roundActive: room.roundActive,
    gameOver: !!room.gameOver,
    winnerId: room.winnerId || null,
    hostId: host?.id || null,
    roundsPlayed: room.roundsPlayed
  });

  io.to(roomCode).emit('playerList',
  Object.values(room.players).map(p => ({
    id: p.id,
    name: p.name,
    host: p.host,
    wins: p.wins,
    ready: p.ready,
    spectator: p.spectator
  }))
);

}

function clearTurnTimer(roomCode) {
  const room = rooms[roomCode];
  if (room?.turnTimer) clearTimeout(room.turnTimer);
room.turnTimer = null;
room.turnDeadline = null;
  io.to(roomCode).emit('turnDeadline', { deadline: null });
}

function startTurnTimer(roomCode) {
  const room = rooms[roomCode];
  if (!room || !room.roundActive) return;

  if (room.turnTimer) clearTurnTimer(roomCode);
  const currentId = room.currentPlayerOrder[room.turnIndex];
  const deadline = Date.now() + TURN_MS;

  room.turnDeadline = deadline;
  io.to(roomCode).emit('turnDeadline', { deadline: deadline + TURN_EMIT_BUFFER_MS });

  room.turnTimer = setTimeout(() => {
    const p = room.players[currentId];
    if (p && p.alive && !p.busted && !p.stood) {
      p.stood = true;
      io.to(roomCode).emit('log', `${p.name} timed out and auto-Stood.`);
      nextTurn(roomCode);
    }
    clearTurnTimer(roomCode);
  }, TURN_MS + 50);
}

function nextTurn(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;

  const order = room.currentPlayerOrder;
  
  // Step 1: Make sure we have players to check
  if (order.length === 0) {
    endRound(roomCode);
    return;
  }
  
  for (let i = 1; i <= order.length; i++) {
    const idx = (room.turnIndex + i) % order.length;
    const p = room.players[order[idx]];
    if (p && p.alive && !p.busted && !p.stood) {
      // Step 2: Make sure index is valid before setting
      room.turnIndex = Math.max(0, Math.min(idx, order.length - 1));
      updateState(roomCode);
      startTurnTimer(roomCode);
      return;
    }
  }
  endRound(roomCode);
}

function startRound(roomCode) {
  clearNextRoundCountdown(roomCode);
  setPhase(roomCode, 'round');
  const room = rooms[roomCode];
  if (!room || room.roundActive) return;

  // Reset ready state BEFORE round starts
  Object.values(room.players).forEach(p => {
    p.ready = false;
  });

  clearReadyCountdown(roomCode);

  const alivePlayers = Object.values(room.players)
    .filter(p => p.alive && !p.spectator);

  // 🛑 Guard: need at least 2 players
  if (alivePlayers.length < 2) {
    io.to(roomCode).emit('log', 'Not enough players to start the round.');
    return;
  }

  room.deck = createDeck();
  shuffle(room.deck);

  alivePlayers.forEach(p => {
    p.hand = [room.deck.pop(), room.deck.pop()];
    p.busted = false;
    p.stood = false;
  });

  room.currentPlayerOrder = alivePlayers.map(p => p.id);
  room.turnIndex = 0;
  room.roundActive = true;

  io.to(roomCode).emit('log', '🔄 New round started!');
  updateState(roomCode);
  startTurnTimer(roomCode);
}


function endRound(roomCode) {
  const room = rooms[roomCode];
  if (!room || room.endingRound || !room.roundActive) return;

  room.endingRound = true;
  room.triggerLocked = true;

  clearTurnTimer(roomCode);

 const alive = Object.values(room.players).filter(p => p.alive && !p.spectator);

if (alive.length === 1) {
  clearNextRoundCountdown(roomCode);
  const winner = alive[0];

  room.winnerId = winner.id;
  room.gameOver = true;
  room.roundActive = false;
  room.endingRound = false;
  room.triggerLocked = false;

  winner.wins++;

  setPhase(roomCode, 'postgame');

  io.to(roomCode).emit('victory', {
    winnerId: winner.id,
    winnerName: winner.name
  });

  updateState(roomCode);

  setTimeout(() => {
    resetRoomToLobby(roomCode);
  }, RETURN_TO_LOBBY_SECONDS * 1000);

  return; // ⛔ NOTHING ELSE RUNS
}


const busted = alive.filter(p => p.busted);
const nonBusted = alive.filter(p => !p.busted);

let candidates;

// RULE 1: If anyone busted → busted players ONLY
if (busted.length > 0) {
  candidates = busted;
  io.to(roomCode).emit(
    'log',
    '💥 Busting players are at highest risk!'
  );
}
// RULE 2: No one busted → lowest hand
else {
  const lowestValue = Math.min(
    ...nonBusted.map(p => handValue(p.hand))
  );

  candidates = nonBusted.filter(
    p => handValue(p.hand) === lowestValue
  );

  io.to(roomCode).emit(
    'log',
    `⚖️ No one busted — lowest hand (${lowestValue}) at risk`
  );
}

// 🛑 SAFETY GUARD — no valid candidates
if (!candidates || candidates.length === 0) {
  console.warn('[END ROUND] No valid loser candidates. Resetting round safely.');

  room.roundActive = false;
  room.endingRound = false;

  Object.values(room.players).forEach(p => {
    p.hand = [];
    p.busted = false;
    p.stood = false;
    p.ready = false;
  });

  updateState(roomCode);
  
  if (!room.gameOver) {
    startNextRoundCountdown(roomCode);
  }
  
  return;
}

  const chosen = candidates[Math.floor(Math.random()*candidates.length)];
  setPhase(roomCode, 'trigger');

  if (!room.gameOver) {
  io.to(roomCode).emit('triggerPull', {
    loserId: chosen.id,
    loserName: chosen.name
  });
}
  io.to(roomCode).emit('log', `${chosen.name} is chosen to roll.`);
  
  // 🔒 DELAY ELIMINATION UNTIL AFTER TRIGGER ANIMATION
setTimeout(() => {
  if (room.pendingElimination) {
  const p = room.players[room.pendingElimination.playerId];

  // 🔒 NEVER eliminate if game is already over
  if (p && !room.gameOver) {
    p.alive = false;
    p.spectator = true;
    p.ready = false;
    p.host = false;
  }

  room.pendingElimination = null;
}

reassignHost(room);

  room.triggerLocked = false;   // 🔓 UNLOCK STATE
  updateState(roomCode);
}, 3600);


  const roll = Math.floor(Math.random()*6)+1;
  let eliminated = roll <= ELIM_THRESHOLD;


  room.pendingElimination = eliminated
  ? { playerId: chosen.id }
  : null;

// 🛑 SAFETY: never emit roundSummary after game over
if (room.gameOver) {
  return;
}

  if (eliminated) {
  io.to(chosen.id).emit('eliminated', { winnerName: null });
}

  if (eliminated) {
  room.roundsPlayed++;
}

  io.to(roomCode).emit('roundSummary', {
    roundNumber: room.roundsPlayed,
    busted: busted.map(b => ({ name: b.name, value: handValue(b.hand) })),
    loserCandidates: candidates.map(c => c.name),
    chosenLoser: chosen.name,
    roll,
    eliminated,
    winnerName: null
  });
  Object.values(room.players).forEach(p => {
  p.hand = [];
  p.busted = false;
  p.stood = false;
});

  room.endingRound = false;
  room.roundActive = false;
  updateState(roomCode);
if (!eliminated && !room.gameOver) {
  setTimeout(() => {
    startNextRoundCountdown(roomCode);
  }, 3800); // after trigger animation finishes
}


}

function resetRoomToLobby(roomCode) {
  clearNextRoundCountdown(roomCode);
  const room = rooms[roomCode];
  if (!room) return;

  // Stop timers
  clearTurnTimer(roomCode);
  clearReadyCountdown(roomCode);

  room.roundActive = false;
  room.endingRound = false;
  room.gameOver = false;
  room.winnerId = null;
  room.triggerLocked = false;

  room.turnIndex = 0;
  room.currentPlayerOrder = [];

  // ✅ FULL HARD RESET — EVERYONE RETURNS TO LOBBY
  const players = Object.values(room.players);

  players.forEach(p => {
    p.hand = [];
    p.busted = false;
    p.stood = false;
    p.ready = false;
    p.spectator = false;   // 🔥 IMPORTANT
    p.alive = true;        // 🔥 IMPORTANT
    p.host = false;
  });

reassignHost(room);
setPhase(roomCode, 'lobby');

// 🔔 FORCE CLIENTS BACK TO LOBBY
io.to(roomCode).emit('gameReset');

updateState(roomCode);
 
}


function checkReadyStart(roomCode) {
  const room = rooms[roomCode];
  if (!room || room.roundActive) return;

  const players = Object.values(room.players)
    .filter(p => p.alive && !p.spectator);

  if (players.length < 2) return;

  // ✅ THIS IS THE AUTHORITATIVE CONDITION
  if (players.every(p => p.ready)) {
    clearReadyCountdown(roomCode);
    startRound(roomCode);
  }
}



function startReadyCountdown(roomCode) {
  const room = rooms[roomCode];
  if (!room || room.readyCountdownTimer) return;

  const players = Object.values(room.players)
    .filter(p => p.alive && !p.spectator);

  // 🚀 If everyone already ready → start immediately
  if (players.length >= 2 && players.every(p => p.ready)) {
    startRound(roomCode);
    return;
  }

  room.readyCountdownEndsAt = Date.now() + READY_COUNTDOWN_MS;

  io.to(roomCode).emit('readyCountdown', {
    endsAt: room.readyCountdownEndsAt
  });

  room.readyCountdownTimer = setTimeout(() => {
    clearReadyCountdown(roomCode);
    startRound(roomCode);
  }, READY_COUNTDOWN_MS);
}


function clearReadyCountdown(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;

  if (room.readyCountdownTimer) {
    clearTimeout(room.readyCountdownTimer);
    room.readyCountdownTimer = null;
  }

  room.readyCountdownEndsAt = null;
  io.to(roomCode).emit('readyCountdown', { endsAt: null });
}

function startNextRoundCountdown(roomCode) {
  const room = rooms[roomCode];
  if (!room || room.roundActive || room.gameOver) return;

  if (room.nextRoundTimer) return;

  room.nextRoundEndsAt = Date.now() + NEXT_ROUND_COUNTDOWN_MS;

  io.to(roomCode).emit(
  'log',
  '⏳ Next round will start in 10 seconds...'
);

  io.to(roomCode).emit('nextRoundCountdown', {
    endsAt: room.nextRoundEndsAt
  });

  room.nextRoundTimer = setTimeout(() => {
    room.nextRoundTimer = null;
    room.nextRoundEndsAt = null;

    if (!room.gameOver) {
      startRound(roomCode);
    }
  }, NEXT_ROUND_COUNTDOWN_MS);
}

function clearNextRoundCountdown(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;

  if (room.nextRoundTimer) {
    clearTimeout(room.nextRoundTimer);
    room.nextRoundTimer = null;
  }

  room.nextRoundEndsAt = null;

  io.to(roomCode).emit('nextRoundCountdown', { endsAt: null });
}




io.on('connection', socket => {

  socket.on('createRoom', () => {
  // Step 1: Try to create a unique room code
  let code;
  let attempts = 0;
  
  do {
    code = Math.random().toString(36).slice(2,8).toUpperCase();
    attempts++;
  } while (rooms[code] && attempts < 10); // Keep trying if code already exists
  
  // Step 2: If we couldn't find a unique code, tell the player
  if (rooms[code]) {
    return socket.emit('roomError', 'Failed to create room. Please try again.');
  }
  
  // Step 3: Create the room with the unique code
  rooms[code] = createRoom();
    socket.join(code);
    socket.data.roomCode = code;

    rooms[code].ownerId = socket.id;


    rooms[code].players[socket.id] = {
      id: socket.id,
      name: 'Player',
      hand: [],
      alive: true,
      busted: false,
      stood: false,
      host: true,
      wins: 0,
      spectator: false,
      ready: false,
    };
    const token = makeToken();
    socket.data.token = token;
    savePlayerToken(socket, token);
    socket.emit('assignToken', { token });


    socket.emit('roomJoined', { roomCode: code });
    updateState(code);
  });

  socket.on('identify', token => {
  if (typeof token !== 'string') return;

  const saved = playersByToken[token];
  if (!saved) return;

  socket.data.token = token;
  playersByToken[token].lastSeen = Date.now();

  const room = rooms[saved.roomCode];
  if (!room) return;
  // Remove old instance of this player (by token)
for (const id of Object.keys(room.players)) {
  if (room.players[id]?.id === saved.player.id) {
    delete room.players[id];
  }
}


  // Restore player with NEW socket.id
  const restoredPlayer = {
  ...saved.player,
  id: socket.id,
  hand: [],
  busted: false,
  stood: false
};
  restoredPlayer.alive = saved.player.alive === true;
  if (room.roundActive) {
  restoredPlayer.busted = false;
  restoredPlayer.stood = false;
}



  room.players[socket.id] = restoredPlayer;
  // 🔁 IMPORTANT: update ownerId if owner reconnects
if (room.ownerId === saved.player.id) {
  room.ownerId = socket.id;
}

// 🔒 Restore permanent host if owner
if (room.ownerId === socket.id) {
  restoredPlayer.host = true;
}

reassignHost(room);

  socket.join(saved.roomCode);
  socket.data.roomCode = saved.roomCode;

  // 🔥 CRITICAL: If game is over, emit victory event on reconnect
  if (room.gameOver && room.winnerId) {
    const winner = room.players[room.winnerId];
    if (winner) {
      io.to(socket.id).emit('victory', {
        winnerId: winner.id,
        winnerName: winner.name
      });
    }
  }

  io.to(socket.id).emit('phaseChange', {
  phase: room.phase || 'lobby'
});

  // Rebuild turn order safely
  room.currentPlayerOrder = Object.values(room.players)
    .filter(p => p.alive && !p.spectator)
    .map(p => p.id);

  room.turnIndex = Math.min(room.turnIndex, room.currentPlayerOrder.length - 1);

  updateState(saved.roomCode);
});



  socket.on('joinRoom', code => {
  // Step 1: Make sure code is a string
  if (typeof code !== 'string') {
    return socket.emit('roomError', 'Invalid room code');
  }
  
  // Step 2: Clean up the code (remove spaces, uppercase)
  const cleanCode = code.trim().toUpperCase();
  
  // Step 3: Check code is the right length (6 characters)
  if (cleanCode.length !== 6) {
    return socket.emit('roomError', 'Room code must be 6 characters');
  }
  
  // Step 4: Check if room exists
  const room = rooms[cleanCode];
  if (!room) return socket.emit('roomError', 'Room not found');

    socket.join(cleanCode);
    socket.data.roomCode = cleanCode;

    room.players[socket.id] = {
      id: socket.id,
      name: 'Player',
      hand: [],
      alive: true,
      busted: false,
      stood: false,
      host: false,
      wins: 0,
      spectator: false,
      ready: false,
    };

    io.to(socket.id).emit('phaseChange', {
  phase: room.phase || 'lobby'
});

    updateState(cleanCode);

    
    const token = makeToken();
    socket.data.token = token;
    savePlayerToken(socket, token);
    socket.emit('assignToken', { token });


    socket.emit('roomJoined', { roomCode: cleanCode });
    
  });

 socket.on('leave', () => {
  const roomCode = socket.data.roomCode;
  clearNextRoundCountdown(roomCode);

  const room = rooms[roomCode];
  if (!room) return;

  delete room.players[socket.id];
  reassignHost(room);


  if (socket.data.token) {
  delete playersByToken[socket.data.token];
}

  room.currentPlayerOrder = Object.values(room.players)
    .filter(p => p.alive && !p.spectator)
    .map(p => p.id);

  if (room.roundActive) {
    nextTurn(roomCode);
  }

  if (Object.keys(room.players).length === 0) {
    delete rooms[roomCode];
  } else {
    clearReadyCountdown(roomCode);
    updateState(roomCode);
  }

  socket.leave(roomCode);
});



  socket.on('setName', name => {
  const room = rooms[socket.data.roomCode];
  if (room?.players[socket.id]) {
    // Step 1: Convert to string and remove extra spaces
    const cleaned = String(name).trim();
    
    // Step 2: Remove dangerous characters like < and >
    const safe = cleaned.replace(/[<>]/g, '');
    
    // Step 3: Limit length to 20 characters
    const final = safe.slice(0, 20);
    
    // Step 4: Only save if name is not empty
    if (final) {
      room.players[socket.id].name = final;
      if (socket.data.token) {
        savePlayerToken(socket, socket.data.token);
      }
      updateState(socket.data.roomCode);
    }
  }
});

socket.on('toggleReady', () => {
  const roomCode = socket.data.roomCode;
  const room = rooms[roomCode];
  const p = room?.players[socket.id];
  if (!p || p.spectator) return;

  // Toggle ready state
  p.ready = !p.ready;

  io.to(roomCode).emit(
    'log',
    `${p.name} is ${p.ready ? 'READY' : 'NOT READY'}`
  );

  // 🔴 IMPORTANT LOGIC
  if (!p.ready) {
  // Someone unreadied → cancel countdown
  clearReadyCountdown(roomCode);
} else {
  // Someone readied → ALWAYS re-check
  checkReadyStart(roomCode);
}

  updateState(roomCode);
});



  socket.on('startRound', () => {
  const roomCode = socket.data.roomCode;
  const room = rooms[roomCode];
  if (!room) return;

  if (room.nextRoundTimer) return;

  const host = room.players[socket.id];
  if (!host || !host.host) return;
  if (room.roundActive) return;

  const alivePlayers = Object.values(room.players)
    .filter(p => p.alive && !p.spectator);

  if (alivePlayers.length < 2) {
    socket.emit('log', 'Need at least 2 players to start.');
    return;
  }

  // ✅ HOST PRESSING START = HOST IS READY
  host.ready = true;

  io.to(roomCode).emit(
    'log',
    `${host.name} started the round`
  );

  // 🔥 IMMEDIATE CHECK
  checkReadyStart(roomCode);

  // ⏱️ If not everyone is ready yet, start countdown
  if (!room.roundActive) {
    startReadyCountdown(roomCode);
  }

  updateState(roomCode);
});



  socket.on('hit', () => {
  const room = rooms[socket.data.roomCode];
  const p = room?.players[socket.id];
  if (!p || !room.roundActive || room.triggerLocked) return;


  const now = Date.now();
  if (now - (p.lastActionAt || 0) < ACTION_COOLDOWN_MS) return;
  p.lastActionAt = now;

  // Step 1: Check if deck is running low (less than 5 cards)
  if (room.deck.length < 5) {
    // Step 2: Create and shuffle a new deck
    room.deck = createDeck();
    shuffle(room.deck);
    io.to(socket.data.roomCode).emit('log', '🔄 Deck reshuffled!');
  }

  // Step 3: Now it's safe to pop a card
  p.hand.push(room.deck.pop());
  if (handValue(p.hand) > 21) p.busted = true;
  if (socket.data.token) {
  savePlayerToken(socket, socket.data.token);
}


  nextTurn(socket.data.roomCode);
});


  socket.on('stand', () => {
  const room = rooms[socket.data.roomCode];
  const p = room?.players[socket.id];
  if (!p || !room.roundActive || room.triggerLocked) return;


  const now = Date.now();
  if (now - (p.lastActionAt || 0) < ACTION_COOLDOWN_MS) return;
  p.lastActionAt = now;

  p.stood = true;
  if (socket.data.token) {
  savePlayerToken(socket, socket.data.token);
}


  nextTurn(socket.data.roomCode);
});


  socket.on('spectate', () => {
    const room = rooms[socket.data.roomCode];
    const p = room?.players[socket.id];
    if (!p) return;
    p.alive = false;
    p.spectator = true;
    p.ready = false;
    if (socket.data.token) {
  savePlayerToken(socket, socket.data.token);
}

    updateState(socket.data.roomCode);
  });

  socket.on('requestNewGame', () => {
  const roomCode = socket.data.roomCode;
  const room = rooms[roomCode];
  if (!room) return;

  const p = room.players[socket.id];
  if (!p || !p.host) return;

  resetRoomToLobby(roomCode);
});

  socket.on('disconnect', () => {
  const roomCode = socket.data.roomCode;
  const room = rooms[roomCode];
  if (!room) return;

  const name = room.players[socket.id]?.name || 'A player';

  clearReadyCountdown(roomCode);
  clearTurnTimer(roomCode);

  delete room.players[socket.id];

  room.currentPlayerOrder = Object.values(room.players)
    .filter(p => p.alive && !p.spectator)
    .map(p => p.id);

  if (room.roundActive) {
    nextTurn(roomCode);
  }

  const remaining = Object.values(room.players);
  reassignHost(room);


  if (remaining.length === 0) {
    delete rooms[roomCode];
  } else {
    io.to(roomCode).emit('log', `${name} disconnected.`);
    updateState(roomCode);
  }
});


});

server.listen(3000, () => console.log('Server running on http://localhost:3000'));

setInterval(() => {
  const now = Date.now();
  for (const token of Object.keys(playersByToken)) {
    if (now - playersByToken[token].lastSeen > RECONNECT_WINDOW_MS * 10) {
      delete playersByToken[token];
    }
  }
}, 60000);