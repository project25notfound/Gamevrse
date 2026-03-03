// client.js
// Defensive socket init (avoid error when socket.io client not present)
const socket = (typeof io !== 'undefined') ? io() : null;

// DOM
const status = document.getElementById("status");
const startBtn = document.getElementById("startBtn");
const countdownEl = document.getElementById("countdown");
const inputTimerEl = document.getElementById("inputTimer");
const lobbyPlayersEl = document.getElementById("lobbyPlayers");
const playersEl = document.getElementById("players");
const buttonsContainer = document.getElementById("buttons");
const audioToggle = document.getElementById("audioToggle");
const nameInput = document.getElementById("nameInput");
const enterBtn = document.getElementById("enterBtn");
const howToBtn = document.getElementById("howToBtn");
const howToContent = document.getElementById("howToContent");
const exitBtn = document.getElementById("exitButton");
const gameContainer = document.getElementById("gameContainer");
const introScreen = document.getElementById("introScreen");

const scoreboardEl = document.getElementById("scoreboard");
const winnerNameEl = document.getElementById("winnerName");
const finalScoresEl = document.getElementById("finalScores");
const tieBanner = document.getElementById("tieBreakerBanner");
const readyArea = document.getElementById("readyArea");
const readyBtn = document.getElementById("readyBtn");
const autoReadyTimerEl = document.getElementById("autoReadyTimer");
const playAgainBtn = document.getElementById("playAgainBtn");
const practiceBtn = document.getElementById("practiceBtn");
const practiceRetryBtn = document.getElementById("practiceRetryBtn");

const tiles = {
  red: document.getElementById("red"),
  green: document.getElementById("green"),
  blue: document.getElementById("blue"),
  yellow: document.getElementById("yellow")
};

let myName = "Player";
let sequence = [];
let playerSequence = [];
let waitingForInput = false;
let round = 0;
let roundTimer = null;
let startTime = 0;
let audioEnabled = true;
let audioUnlocked = false;
let isLocal = false;         // local practice mode flag
let localRound = 0;
let localTimer = null;
let readyTimeout = null;
let readyCountdown = 8;
const allAudio = [];

// preloaded simon sounds
const sounds = {
  red: new Audio("https://s3.amazonaws.com/freecodecamp/simonSound1.mp3"),
  green: new Audio("https://s3.amazonaws.com/freecodecamp/simonSound2.mp3"),
  blue: new Audio("https://s3.amazonaws.com/freecodecamp/simonSound3.mp3"),
  yellow: new Audio("https://s3.amazonaws.com/freecodecamp/simonSound4.mp3")
};
Object.values(sounds).forEach(s => { s.preload = 'auto'; allAudio.push(s); });

// fx helper
function createAudio(src, vol=1) {
  const a = new Audio(src);
  a.preload = 'auto';
  a.volume = Math.max(0, Math.min(1, vol));
  allAudio.push(a);
  return a;
}
const fx = {
  enter: createAudio('https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg', 0.7),
  roundStart: createAudio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg', 0.6),
  success: createAudio('https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg', 0.8),
  fail: createAudio('https://actions.google.com/sounds/v1/cartoon/boing.ogg', 0.8),
  win: createAudio('https://actions.google.com/sounds/v1/cartoon/party_horn.ogg', 0.9),
  streak: createAudio('https://actions.google.com/sounds/v1/cartoon/slide_whistle_to_drum_hit.ogg', 0.7),
  tie: createAudio('https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg', 0.6)
};

function setAudioEnabled(flag, persist = true) {
  audioEnabled = !!flag;
  allAudio.forEach(a => { try { a.muted = !audioEnabled; } catch(e){} });
  audioToggle.textContent = audioEnabled ? '🔊' : '🔈';
  audioToggle.setAttribute('aria-pressed', audioEnabled ? 'true' : 'false');
  audioToggle.title = audioEnabled ? 'Audio enabled' : 'Audio muted';
  if (persist) {
    try { localStorage.setItem('colorRush_audio', audioEnabled ? '1' : '0'); } catch(e){}
  }
}

function unlockAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  const probe = allAudio[0];
  if (!probe) return;
  try {
    const p = probe.play();
    if (p && p.then) {
      p.then(()=>{ probe.pause(); probe.currentTime = 0; }).catch(()=>{});
    }
  } catch(e){}
}

// load saved audio preference
try {
  const val = localStorage.getItem('colorRush_audio');
  if (val !== null) setAudioEnabled(val === '1', false);
  else setAudioEnabled(true, false);
} catch(e) {
  setAudioEnabled(true, false);
}

// Small utility for sleep
function sleep(ms){ return new Promise(res => setTimeout(res, ms)); }

// UI helpers
function showTemporaryMessage(el, text, className, duration=3000) {
  if(!el) return;
  el.className = className;
  el.textContent = text;
  if (duration > 0) setTimeout(()=>{ el.textContent=''; el.className=''; }, duration);
}
function escapeHtml(s) {
  return String(s || '').replace(/[&<>"'`]/g, (m) => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;'
  })[m]);
}

// Enable/disable tile interaction
function disableTiles(){ Object.values(tiles).forEach(t => t.disabled = true); }
function enableTiles(){ Object.values(tiles).forEach(t => t.disabled = false); }

// Light tile programmatically
function lightUp(color, duration = 400) {
  const btn = tiles[color];
  if(!btn) return;
  btn.classList.add("active");
  try { if (audioEnabled && sounds[color]) { sounds[color].currentTime = 0; sounds[color].play(); } } catch(e){}
  setTimeout(()=> btn.classList.remove("active"), duration);
}

// Sequence playback (client/local)
async function playSequence(seq) {
  waitingForInput = false;
  disableTiles();
  await showCountdown(5);

  status.textContent = `Round ${round}: Watch closely!`;
  inputTimerEl.textContent = "";

  try { if (audioEnabled) fx.roundStart.play(); } catch(e){}

  const lightDuration = Math.max(600 - (round - 1) * 50, 200);
  for (const color of seq) {
    lightUp(color, lightDuration);
    await sleep(lightDuration + 150);
  }

  status.textContent = `Round ${round}: Your turn!`;
  waitingForInput = true;
  playerSequence = [];
  startTime = Date.now();
  startRoundTimer();
  enableTiles();
}

async function showCountdown(seconds) {
  countdownEl.textContent = `Get ready: ${seconds}`;
  for (let i = seconds - 1; i >= 0; i--) {
    await sleep(1000);
    countdownEl.textContent = i > 0 ? `Get ready: ${i}` : '';
  }
}

// Timer for player's input
function startRoundTimer() {
  clearInterval(roundTimer);
  let remaining = 30;
  inputTimerEl.textContent = `🕒 Time left: ${remaining}s`;
  roundTimer = setInterval(() => {
    remaining--;
    inputTimerEl.textContent = `🕒 Time left: ${remaining}s`;
    if (remaining <= 0) {
      clearInterval(roundTimer);
      if (waitingForInput) {
        waitingForInput = false;
        inputTimerEl.textContent = "⏰ Time's up!";
        status.textContent = "⏰ Time's up! You're eliminated.";
        disableTiles();
        try { if (audioEnabled) fx.fail.play(); } catch(e){}
        // submit (server or local)
        if (isLocal) {
          localSubmitSequence({ inputSequence: playerSequence, timeTaken: 30000 });
        } else {
          emitSafe("submitSequence", { inputSequence: playerSequence, timeTaken: 30000 });
        }
      }
    }
  }, 1000);
}

// Safe emit wrapper (no-op if socket missing)
function emitSafe(ev, payload) {
  if (isLocal) {
    // local mode: no socket emits
    console.log("local-mode emit skipped:", ev, payload);
    return;
  }
  if (socket && socket.connected) {
    try { socket.emit(ev, payload); } catch(e) { console.warn("emit failed", e); }
  } else {
    console.warn("socket not available, would have emitted:", ev, payload);
  }
}

// Tile activation (called by click or keyboard)
function activateTile(color) {
  unlockAudio();
  if (!waitingForInput) return;
  playerSequence.push(color);
  lightUp(color);
  const i = playerSequence.length - 1;
  if (playerSequence[i] !== sequence[i]) {
    waitingForInput = false;
    clearInterval(roundTimer);
    inputTimerEl.textContent = "";
    status.textContent = "❌ Wrong! You're eliminated.";
    disableTiles();
    try { if (audioEnabled) fx.fail.play(); } catch(e){}
    if (isLocal) {
      localSubmitSequence({ inputSequence: playerSequence, timeTaken: Number.MAX_SAFE_INTEGER });
    } else {
      emitSafe("submitSequence", { inputSequence: playerSequence, timeTaken: Number.MAX_SAFE_INTEGER });
    }
    return;
  }
  if (playerSequence.length === sequence.length) {
    waitingForInput = false;
    clearInterval(roundTimer);
    inputTimerEl.textContent = "";
    disableTiles();
    const timeTaken = Date.now() - startTime;
    status.textContent = `✅ Correct! Time: ${timeTaken} ms`;
    try { if (audioEnabled) fx.success.play(); } catch(e){}
    if (isLocal) {
      localSubmitSequence({ inputSequence: playerSequence, timeTaken });
    } else {
      emitSafe("submitSequence", { inputSequence: playerSequence, timeTaken });
    }
  }
}

// Tile click handlers
Object.keys(tiles).forEach(color => {
  const el = tiles[color];
  if (!el) return;
  el.addEventListener("click", () => {
    activateTile(color);
  });
  // keyboard activation on focused element
  el.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      activateTile(color);
    }
  });
});

// Global keyboard shortcuts: 1-4 map to colors; arrow keys move focus
const colorOrder = ["red","green","blue","yellow"];
document.addEventListener("keydown", (e) => {
  // ignore typing in inputs
  const active = document.activeElement;
  if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;

  if (e.key >= '1' && e.key <= '4') {
    const idx = Number(e.key) - 1;
    const color = colorOrder[idx];
    if (color) {
      const btn = tiles[color];
      if (btn) { btn.focus(); activateTile(color); }
    }
  } else if (e.key === "ArrowRight" || e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "ArrowDown") {
    // move focus among tile buttons in reading order
    const focusable = colorOrder.map(c => tiles[c]).filter(Boolean);
    const idx = focusable.indexOf(document.activeElement);
    let next = 0;
    if (idx === -1) next = 0;
    else {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (idx + 1) % focusable.length;
      else next = (idx - 1 + focusable.length) % focusable.length;
    }
    focusable[next].focus();
  } else if (e.key.toLowerCase() === 'm') { // quick mute toggle (m)
    setAudioEnabled(!audioEnabled);
  }
});

// UI wiring (intro + lobby)
howToBtn.addEventListener("click", () => {
  const open = howToContent.classList.toggle("open");
  howToBtn.setAttribute("aria-expanded", open ? "true" : "false");
  howToContent.setAttribute("aria-hidden", open ? "false" : "true");
});

enterBtn.addEventListener("click", () => {
  const name = nameInput.value.trim();
  if (!name) { 
    alert("Please enter your name."); 
    return; 
  }
  myName = name;
  unlockAudio();
  try { if (audioEnabled) fx.enter.play(); } catch(e){}

  // Hide intro
  introScreen.classList.add("fade-out");
  // after transition, actually hide it
  introScreen.addEventListener("transitionend", () => {
    introScreen.classList.remove("intro-visible");
    introScreen.classList.add("intro-hidden");
    // show game container
    gameContainer.style.display = "block";
    gameContainer.setAttribute("aria-hidden", "false");
  }, { once: true });

  if (!isLocal) emitSafe("registerName", myName);
  else {
    status.textContent = `Practice mode: ${myName}`;
  }
});

// Practice button wiring
if (practiceBtn) {
  practiceBtn.addEventListener("click", () => {
    // Set practice flag and show the game UI, but DO NOT start the round
    const name = (nameInput && nameInput.value && nameInput.value.trim()) ? nameInput.value.trim() : 'Solo';
    isLocal = true;
    myName = name;
    // unlock audio on first interaction
    unlockAudio();
    try { if (audioEnabled) fx.enter.play(); } catch(e){}

    // Hide intro and show game UI
    introScreen.classList.add("fade-out");
    introScreen.addEventListener("transitionend", () => {
      introScreen.classList.remove("intro-visible");
      introScreen.classList.add("intro-hidden");
      gameContainer.style.display = "block";
      gameContainer.setAttribute("aria-hidden", "false");
      // Show Start button so player must press Start Game to begin practice
      startBtn.style.display = "inline-block";
      status.textContent = `Practice mode: ${myName} — press Start Game to begin`;
      // Ensure Try Again hidden (fresh start)
      showPracticeControls(false);
      // HIDE players UI in local practice mode
      try { if (playersEl) playersEl.style.display = 'none'; } catch(e){}
      try { if (lobbyPlayersEl) lobbyPlayersEl.style.display = 'none'; } catch(e){}
    }, { once: true });
  });
}

// startBtn behavior: behave differently for local vs multiplayer
startBtn.addEventListener("click", () => {
  // local practice
  if (isLocal) {
    startBtn.style.display = "none"; // hide button once started
    localRound = 0;
    // Ensure players UI hidden while practice running
    try { if (playersEl) playersEl.style.display = 'none'; } catch(e){}
    try { if (lobbyPlayersEl) lobbyPlayersEl.style.display = 'none'; } catch(e){}
    localStartRound();
    return;
  }

  // multiplayer host start
  emitSafe("startGame");
  startBtn.style.display = "none";
  status.textContent = "Starting game...";
});

audioToggle.addEventListener("click", () => {
  setAudioEnabled(!audioEnabled);
});
setAudioEnabled(audioEnabled, false);

// Ready button logic (shows when prepareNextRound received)
readyBtn.addEventListener("click", () => {
  // user indicated ready
  readyArea.style.display = 'none';
  stopReadyCountdown();
  // emit ready to server (no-op in local mode)
  emitSafe("playerReady", {});
});

// auto-ready countdown helpers
function startReadyCountdown(seconds = 8) {
  readyArea.style.display = 'flex';
  readyCountdown = seconds;
  autoReadyTimerEl.textContent = readyCountdown;
  stopReadyCountdown();
  readyTimeout = setInterval(() => {
    readyCountdown--;
    autoReadyTimerEl.textContent = readyCountdown;
    if (readyCountdown <= 0) {
      // auto-ready
      stopReadyCountdown();
      readyArea.style.display = 'none';
      emitSafe("playerReady", {});
    }
  }, 1000);
}
function stopReadyCountdown() {
  if (readyTimeout) { clearInterval(readyTimeout); readyTimeout = null; }
  autoReadyTimerEl.textContent = '0';
}

// Exit back to lobby (used for both practice & multiplayer)
exitBtn.addEventListener("click", goToMenu);
function goToMenu() {
  // hide tie banner and ready area too
  try { tieBanner.style.display = 'none'; } catch (e) {}
  try { readyArea.style.display = 'none'; } catch (e) {}
  document.getElementById("gameContainer").style.display = "none"; // hide game
  const intro = document.getElementById("introScreen");
  if (intro) {
    intro.classList.remove("intro-hidden");
    intro.classList.add("intro-visible");
    intro.classList.remove("fade-out");
  }
  exitBtn.style.display = "none";
  practiceRetryBtn.style.display = "none";
  document.getElementById("gameOverMessages").innerHTML = "";
  if (scoreboardEl) scoreboardEl.style.display = "none";
  // reset local state
  sequence = [];
  playerSequence = [];
  waitingForInput = false;
  // restore players UI when leaving practice
  try { if (playersEl) playersEl.style.display = ''; } catch(e){}
  try { if (lobbyPlayersEl) lobbyPlayersEl.style.display = ''; } catch(e){}
  isLocal = false;
  localRound = 0;
  clearInterval(roundTimer);
  inputTimerEl.textContent = "";
  countdownEl.textContent = "";
  status.textContent = "Back in lobby.";
  if (!isLocal) emitSafe("requestSync");
}

// Play Again (host)
playAgainBtn.addEventListener("click", () => {
  emitSafe("restartGame", {});
  playAgainBtn.style.display = "none";
});

// Practice controls visibility helper
function showPracticeControls(show) {
  if (!practiceRetryBtn) return;
  practiceRetryBtn.style.display = show ? 'inline-flex' : 'none';
  // keep main exit visible so users can still go out
  exitBtn.style.display = show ? 'inline-flex' : exitBtn.style.display;
}

// Practice Retry handler (restart local practice from round 1)
if (practiceRetryBtn) {
  practiceRetryBtn.addEventListener("click", () => {
    // Reset local state and restart
    sequence = [];
    playerSequence = [];
    waitingForInput = false;
    clearInterval(roundTimer);
    inputTimerEl.textContent = "";
    countdownEl.textContent = "";
    status.textContent = `Practice mode: ${myName} — restarting...`;
    showPracticeControls(false);
    localRound = 0;
    // Ensure startBtn hidden and restart immediately
    startBtn.style.display = "none";
    setTimeout(() => {
      try { localStartRound(); } catch (e) { console.error("localStartRound failed on retry", e); }
    }, 250);
  });
}

// Helper mapping colorIndex -> chip background
function chipColorForIndex(i) {
  const map = ['var(--red)', 'var(--green)', 'var(--blue)', 'var(--yellow)'];
  return map[i % map.length] || 'var(--muted)';
}

// Render a single player card
function renderPlayerCard(p, isMe=false) {
  const outer = document.createElement('div');
  outer.className = 'player-card';
  outer.setAttribute('role','listitem');

  // chip (first letter)
  const chip = document.createElement('div');
  chip.className = 'player-chip';
  chip.style.background = chipColorForIndex(p.colorIndex);
  chip.textContent = (p.name || '?').slice(0,1).toUpperCase();

  // meta
  const meta = document.createElement('div');
  meta.className = 'player-meta';

  const nameRow = document.createElement('div');
  nameRow.className = 'player-name';
  nameRow.innerHTML = escapeHtml(p.name || 'Unknown');
  // host indicator
  if (p.isHost) {
    const b = document.createElement('span');
    b.className = 'badge';
    b.textContent = 'HOST';
    nameRow.appendChild(b);
  }
  if (isMe) {
    const meTag = document.createElement('span');
    meTag.className = 'player-sub';
    meTag.style.marginLeft = '8px';
    meTag.textContent = ' (you)';
    nameRow.appendChild(meTag);
  }

  const sub = document.createElement('div');
  sub.className = 'player-sub';
  sub.textContent = `Lives: ${typeof p.lives === 'number' ? p.lives : '—'}`;

  meta.appendChild(nameRow);
  meta.appendChild(sub);

  // right-side status dot
  const statusDot = document.createElement('div');
  statusDot.className = 'status-dot ' + (p.alive ? 'status-alive' : 'status-dead');

  outer.appendChild(chip);
  outer.appendChild(meta);
  outer.appendChild(statusDot);

  return outer;
}

// Update lobby players container
function updateLobbyPlayers(list) {
  // In local practice mode we intentionally do not show the lobby/player list
  if (isLocal) return;
  if (!lobbyPlayersEl) return;
  lobbyPlayersEl.innerHTML = ''; // clear
  const hostId = (list && list.hostId) ? list.hostId : null;
  const players = Array.isArray(list.players) ? list.players : (list || []);
  players.sort((a,b) => {
    if (a.alive === b.alive) return (a.name || '').localeCompare(b.name || '');
    return a.alive ? -1 : 1;
  });

  players.forEach(p => {
    const obj = {
      id: p.id || p.socketId || null,
      name: p.name || 'Unknown',
      colorIndex: Number.isFinite(p.colorIndex) ? (p.colorIndex|0) : 0,
      alive: typeof p.alive === 'boolean' ? p.alive : true,
      lives: typeof p.lives === 'number' ? p.lives : (p.alive ? 2 : 0),
      isHost: (p.id && list.hostId && p.id === list.hostId) || !!p.isHost
    };
    const isMe = (socket && socket.id && obj.id === socket.id);
    const card = renderPlayerCard(obj, isMe);
    lobbyPlayersEl.appendChild(card);
  });
}

// LOCAL MODE: simple local sequence generation & evaluation
const LOCAL_COLORS = ["red","green","blue","yellow"];
function localGenerateSequence(length) {
  const seq = [];
  for (let i=0;i<length;i++) seq.push(LOCAL_COLORS[Math.floor(Math.random()*LOCAL_COLORS.length)]);
  return seq;
}
async function localStartRound() {
  localRound++;
  round = localRound;
  sequence = localGenerateSequence(3 + (localRound - 1));
  // hide tie banner & ready area
  try { tieBanner.style.display = 'none'; } catch(e){}
  try { readyArea.style.display = 'none'; } catch(e){}
  try { if (audioEnabled) fx.roundStart.play(); } catch(e){}
  // hide practice controls at start of round
  showPracticeControls(false);
  // ensure players UI remains hidden while practicing
  try { if (playersEl) playersEl.style.display = 'none'; } catch(e){}
  try { if (lobbyPlayersEl) lobbyPlayersEl.style.display = 'none'; } catch(e){}
  await playSequence(sequence);
}
function localSubmitSequence(data) {
  // data: { inputSequence, timeTaken }
  const inputSequence = Array.isArray(data.inputSequence) ? data.inputSequence : [];
  const correct = inputSequence.length === sequence.length && inputSequence.every((c,i)=>c===sequence[i]);
  if (!correct) {
    status.textContent = "❌ Wrong! Practice session over.";
    try { if (audioEnabled) fx.fail.play(); } catch(e){}
    disableTiles();
    // show practice controls so user can retry or exit
    showPracticeControls(true);
  } else {
    try { if (audioEnabled) fx.success.play(); } catch(e){}
    status.textContent = "✅ Correct! Next local round starting...";
    // schedule next local round
    setTimeout(() => localStartRound(), 1200);
  }
}

// Socket events (only attach if socket is present)
if (socket) {
  socket.on("connect", () => {
    status.textContent = "Connected. Waiting for players...";
    setAudioEnabled(audioEnabled);
    emitSafe("requestSync");
  });

  socket.on("playerCount", count => {
    // if local, don't show player count in practice
    if (isLocal) return;
    status.textContent = `Players connected: ${count}`;
  });

  socket.on("playerList", list => {
    // don't update players UI while practicing
    if (isLocal) return;
    updateLobbyPlayers({ players: list, hostId: null });
    playersEl.innerHTML = list.map(p => `<li class="playerName${p.colorIndex}">${escapeHtml(p.name)} ${p.alive ? '' : '❌'}</li>`).join("");
  });

  socket.on("youAreHost", () => {
    // host info irrelevant in local practice
    if (isLocal) return;
    status.textContent = "You are the host. Start when ready.";
    startBtn.style.display = "inline-block";
    startBtn.disabled = false;
  });

  // prepareNextRound: show ready UI then server will wait for playerReady from everyone
  socket.on("prepareNextRound", () => {
    if (isLocal) return;
    status.textContent = "Prepare for next round. Click READY when you're ready.";
    startReadyCountdown(8);
    disableTiles();
  });

  // tie breaker notification
  socket.on("tieBreakerStart", (data) => {
    const names = data.names && data.names.length ? data.names : [];
    const nameText = names.length ? `${names.join(' & ')}` : 'top players';
    const bannerText = `🏆 TIE-BREAKER ROUND — ${nameText}! Winner takes all!`;
    if (tieBanner) { tieBanner.textContent = bannerText; tieBanner.style.display = 'block'; }
    if (status && !isLocal) status.innerHTML = `<strong style="color:gold">Tie-breaker — ${escapeHtml(nameText)} are tied!</strong>`;
    try { if (audioEnabled) fx.tie.play(); } catch(e){}
  });

  socket.on("roundStart", data => {
    // hide any tie banner since new round is about to start
    try { tieBanner.style.display = 'none'; } catch(e){}
    try { readyArea.style.display = 'none'; } catch(e){}
    stopReadyCountdown();
    document.body.classList.add("game-active");
    round = data.round;
    sequence = data.sequence;
    enableTiles();
    try { if (audioEnabled) fx.roundStart.play(); } catch(e){}
    playSequence(sequence);
  });

  socket.on("eliminated", () => {
    status.textContent = "❌ You were eliminated.";
    clearInterval(roundTimer);
    inputTimerEl.textContent = "";
    disableTiles();
    try { if (audioEnabled) fx.fail.play(); } catch(e){}
  });

  socket.on("correct", (data) => {
    status.textContent = "✅ Waiting for others...";
    clearInterval(roundTimer);
    inputTimerEl.textContent = "";
    if (data.streak >= 3) {
      document.getElementById("streakMessages").innerHTML = `🔥 You're on a <b>${data.streak}</b> streak! (+${data.streakBonus})`;
      document.getElementById("streakMessages").className = "streak-message streak-glow";
      try { if (audioEnabled) fx.streak.play(); } catch(e){}
    } else {
      document.getElementById("streakMessages").innerHTML = "";
      document.getElementById("streakMessages").className = "";
    }
  });

  socket.on("lifeLost", (data) => {
    const box = document.getElementById("lifeMessages");
    if (!box) return;
    box.className = "life-warning";
    box.innerHTML = `⚠️ Wrong tile! You have <b>${data.livesLeft}</b> life left. ${data.livesLeft === 1 ? "One more mistake and it's GAME OVER!" : ""}`;
    try { if (audioEnabled) fx.fail.play(); } catch(e){}
    setTimeout(()=>{ box.innerHTML = ""; box.className = ""; }, 5000);
  });

  socket.on("streakUpdate", (data) => {
    const box = document.getElementById("streakMessages");
    if (!box) return;
    if (data.active && data.streak >= 3) {
      box.className = "streak-message streak-glow";
      box.innerHTML = `🔥 You’re on a streak! (x${data.streak})`;
    } else {
      box.innerHTML = "";
      box.className = "";
    }
  });

  socket.on("pointsEarned", (data) => {
    const box = document.getElementById("pointsMessages");
    if (!box) return;
    box.className = "points-popup";
    box.innerHTML = `+${data.points} points! (Total: ${data.total})`;
    setTimeout(()=>{ box.innerHTML = ""; box.className = ""; }, 3000);
  });

  socket.on("playerEliminated", data => {
    if (isLocal) return;
    status.innerHTML = `❌ <span class="playerName${data.colorIndex}">${escapeHtml(data.name)}</span> was eliminated.`;
    try { if (audioEnabled) fx.fail.play(); } catch(e){}
  });

  // Updated gameOver handler: populate scoreboard banner and list, show play again for host
  socket.on("gameOver", data => {
    try { tieBanner.style.display = 'none'; } catch(e){}
    document.body.classList.remove("game-active");

    const winnerName = data.winnerName || "Unknown";
    const scoreboard = Array.isArray(data.scoreboard) ? data.scoreboard : [];

    if (winnerNameEl) winnerNameEl.textContent = winnerName;

    if (finalScoresEl) {
      finalScoresEl.innerHTML = "";
      scoreboard.forEach(p => {
        const li = document.createElement("li");
        const pos = document.createElement("div"); pos.className = "pos"; pos.textContent = `${p.position}.`;
        const player = document.createElement("div"); player.className = "player"; player.innerHTML = `${escapeHtml(p.name)}`;
        const score = document.createElement("div"); score.className = "score"; score.textContent = `${p.score} pts`;
        li.appendChild(pos); li.appendChild(player); li.appendChild(score);
        if (p.name === winnerName) {
          li.style.boxShadow = "0 6px 22px rgba(255,200,70,0.06)";
          li.style.border = "1px solid rgba(255,200,70,0.12)";
        }
        finalScoresEl.appendChild(li);
      });
    }

    if (scoreboardEl) scoreboardEl.style.display = "block";
    status.innerHTML = "Game finished. Check the scoreboard below 👇";

    clearInterval(roundTimer);
    inputTimerEl.textContent = "";
    disableTiles();

    if (socket.id === data.winner) {
      try { if (audioEnabled) fx.win.play(); } catch(e){}
      const duration = 3000;
      const end = Date.now() + duration;
      (function frame() {
        confetti({ particleCount: 6, spread: 360, origin: { x: Math.random(), y: Math.random() - 0.2 }, colors: ["#FFD700","#FFA500","#FFFFFF"] });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
    }

    // show exit and playAgain (host only)
    exitBtn.style.display = "inline-flex";
    playAgainBtn.style.display = "none";
    setTimeout(()=> {
      if (exitBtn.style.display !== "none") {
      }
    }, 60000);
  });

  socket.on("sync", data => {
    // in local practice mode we don't update lobby/player UI from server
    if (!isLocal) {
      updateLobbyPlayers({ players: data.players || [], hostId: data.hostId || null });
      // show playAgain for host when in scoreboard
      if (data.hostId && data.hostId === socket.id) {
        if (scoreboardEl && scoreboardEl.style.display === 'block') {
          playAgainBtn.style.display = 'inline-flex';
        }
        startBtn.style.display = "inline-block";
      } else {
        playAgainBtn.style.display = 'none';
      }
      if (data.gameStarted) {
        status.textContent = `Game in progress — Round ${data.round || 0}`;
      }
    }
  });

  socket.on("chatMessage", m => {
    console.log("chat:", m);
  });

  socket.on("disconnect", () => {
    if (isLocal) return;
    status.textContent = "Disconnected. Attempting to reconnect...";
  });
} else {
  // No socket.io loaded: show friendly offline message
  status.textContent = "Offline: socket.io not found. Use local practice mode.";
  startBtn.style.display = "none";
}

// --- GLOBAL INTEGRATION HOOKS ---
// startColorRush supports { name, skipIntro, local }
window.startColorRush = function(options) {
  options = options || {};
  // detect local flag
  isLocal = !!options.local;

  // If a name is passed, store it
  if (options.name && typeof options.name === 'string') {
    myName = options.name;
    // apply to input for consistency
    try { nameInput.value = myName; } catch(e){}
  }

  // Show the intro overlay (unless skipIntro)
  if (options.skipIntro) {
    introScreen.classList.add('fade-out');
    introScreen.addEventListener("transitionend", () => {
      introScreen.classList.remove("intro-visible");
      introScreen.classList.add("intro-hidden");
      gameContainer.style.display = "block";
      gameContainer.setAttribute("aria-hidden", "false");
    }, { once: true });
  } else {
    // Ensure intro is visible (user can still press Enter/Ready)
    introScreen.classList.remove('intro-hidden');
    introScreen.classList.add('intro-visible');
    introScreen.classList.remove('fade-out');
    try { nameInput.focus(); } catch(e){}
  }

  // For multiplayer (server present) we keep previous behavior: use enterBtn to register and hide intro
  if (!isLocal) {
    if (options.name && typeof options.name === 'string') {
      nameInput.value = options.name;
      setTimeout(() => { try { enterBtn.click(); } catch(e) { /* fallback */ } }, 150);
    }
    setTimeout(()=> {
      emitSafe('requestSync');
    }, 250);
    return;
  }

  // ---- Local practice flow ----
  // When called programmatically with local:true, we follow the same behavior
  // as the Practice button: show the UI and show Start button but DO NOT auto-start.
  try {
    introScreen.classList.add('fade-out');
    introScreen.addEventListener("transitionend", () => {
      introScreen.classList.remove("intro-visible");
      introScreen.classList.add("intro-hidden");
      gameContainer.style.display = "block";
      gameContainer.setAttribute("aria-hidden", "false");
      status.textContent = `Practice mode: ${myName} — press Start Game to begin`;
      // ensure Start is visible for practice start
      startBtn.style.display = "inline-block";
      // hide practice controls until session ends
      showPracticeControls(false);
      // hide player UI in practice
      try { if (playersEl) playersEl.style.display = 'none'; } catch(e){}
      try { if (lobbyPlayersEl) lobbyPlayersEl.style.display = 'none'; } catch(e){}
    }, { once: true });
  } catch(e) {
    // fallback UI updates
    try { introScreen.style.display = 'none'; } catch(e){}
    try { gameContainer.style.display = 'block'; } catch(e){}
    status.textContent = `Practice mode: ${myName} — press Start Game to begin`;
    startBtn.style.display = "inline-block";
    showPracticeControls(false);
    try { if (playersEl) playersEl.style.display = 'none'; } catch(e){}
    try { if (lobbyPlayersEl) lobbyPlayersEl.style.display = 'none'; } catch(e){}
  }
};

// finishColorRush unchanged but hides ready area and tie banner
window.finishColorRush = function() {
  try {
    goToMenu();
  } catch (e) {
    if (gameContainer) gameContainer.style.display = "none";
    if (scoreboardEl) scoreboardEl.style.display = "none";
    if (introScreen) {
      introScreen.classList.remove('intro-hidden');
      introScreen.classList.add('intro-visible');
    }
  }
  try {
    if (typeof window.onMinigameFinished === 'function') {
      window.onMinigameFinished();
    }
  } catch(e) {
    console.warn("onMinigameFinished threw:", e);
  }
};

// expose finish helper (internal)
function finishColorRush() { window.finishColorRush(); }







