// public/client.js - safeMode integrated, end-round UI removed, How-to modal added (patched)
// allow external party UI to provide a socket instance via window._BLACKJACK_SOCKET
import './state.js';

import {
  clickSound,
  hitSound,
  standSound,
  gunSound,
  deathSound,
  play,
  unlockAudioOnce
} from './ui/audio.js';


import { renderPlayers } from './ui/renderPlayers.js';
import { renderLobbyPlayers } from './ui/renderLobby.js';

import {
  showDeathOverlay,
  hideDeathOverlay,
  showRoundSummaryOverlay,
  hideRoundSummaryOverlay
} from './ui/overlays.js';

                                   
import { state as appState } from './state.js';
import { resetSafeMode } from './state.js';

import { showVictoryOverlay, hideVictoryOverlay } from './ui/victoryOverlay.js';
import { setScreen } from './ui/screens.js';

import { trapFocus } from './ui/focusTrap.js';



document.addEventListener('pointerdown', unlockAudioOnce, {
  once: true,
  passive: true
});



let socket;
try {
  // Validate the injected socket (must have emit/on)
  if (window._BLACKJACK_SOCKET && typeof window._BLACKJACK_SOCKET.emit === 'function' && typeof window._BLACKJACK_SOCKET.on === 'function') {
    socket = window._BLACKJACK_SOCKET;
  } else {
    socket = io();
  }
} catch (e) {
  // fallback to io()
  socket = io();
}
window.onunload = () => {};

// ---------------------------------------------------------
// SAFE MODE FLAG
// ---------------------------------------------------------
window._BLACKJACK_SAFE_MODE = !!window._BLACKJACK_SAFE_MODE;   // default (coerce)

// ----------------- Elements -----------------
const intro = document.getElementById('introScreen');
const lobby = document.getElementById('lobbyScreen');
const game = document.getElementById('gameScreen');




const nameInput = document.getElementById('nameInput');
const roomCodeInput = document.getElementById('roomCodeInput');

const startBtn = document.getElementById('startBtn');       // lobby
const cancelStartBtn = document.getElementById('cancelStartBtn');
const leaveLobbyBtn = document.getElementById('leaveLobbyBtn');
const readyBtn = document.getElementById('readyBtn');
const readyControls = document.getElementById('readyControls');
const readyCountdownEl = document.getElementById('readyCountdown');

// endBtn intentionally removed
const hitBtn = document.getElementById('hitBtn');
const standBtn = document.getElementById('standBtn');
const exitBtn = document.getElementById('exitBtn');

const waitingBanner = document.getElementById('waitingBanner');
const playerListDiv = document.getElementById('playerList');
const playersWrap = document.getElementById('players');
const playersHeader = document.getElementById('playersHeader');

const gameLog = document.getElementById('gameLog');
const turnTimerEl = document.getElementById('turnTimer');
const roundsCounterEl = document.getElementById('roundsCounter');
const copyRoomCodeBtn = document.getElementById('copyRoomCodeBtn');


const victoryOverlay = document.getElementById('victoryOverlay');
const victoryNameEl = document.getElementById('victoryName');
const victoryClose = document.getElementById('victoryClose');
const confettiContainer = document.getElementById('confettiContainer');

const deathOverlay = document.getElementById('deathOverlay');
const deathText = document.getElementById('deathText');
const bloodCanvas = document.getElementById('bloodCanvas');

const postDeathPanel = document.getElementById('postDeathPanel');
const postWinnerName = document.getElementById('postWinnerName');
const spectateBtn = document.getElementById('spectateBtn');
const backToLobbyBtn = document.getElementById('backToLobbyBtn');

const gunOverlay = document.getElementById('gunOverlay');
const gunBarrel = document.getElementById('gunBarrel');
const gunSmoke = document.getElementById('gunSmoke');
const gunText = document.getElementById('gunText');

const roundSummaryOverlay = document.getElementById('roundSummaryOverlay');
const roundSummaryModal = document.getElementById('roundSummaryModal');
const roundSummaryBody = document.getElementById('roundSummaryBody');
const roundSummaryClose = document.getElementById('roundSummaryClose');
const startNewGameBtn = document.getElementById('startNewGameBtn');
// How-to elements
const howToPlayBtn = document.getElementById('howToPlayBtn');
const howToPlayBtnHeader = document.getElementById('howToPlayBtnHeader');
const howToOverlay = document.getElementById('howToOverlay');
const howToClose = document.getElementById('howToClose');

let pendingPlayerName = null;
let mySocketId = null;
let readyCountdownActive = false;
let queuedRoundSummary = null;
let queuedDeathData = null;
let readyCountdownInterval = null;
let currentRoomCode = null;
let nextRoundInterval = null;





// ----------------- State -----------------
let actionLock = false;
let lastState = null;
function canShowGameOverlays() {
  // ⛔ Once victory starts, NOTHING else may appear
  return appState.uiMode !== 'postgame';
}
// ======================
// DEBUG STATE OVERLAY
// ======================
const debugOverlay =
  document.getElementById('debugStateOverlay');

const DEBUG_ENABLED =
  location.hostname === 'localhost' ||
  location.hostname === '127.0.0.1';

function updateDebugOverlay(state) {
  if (!DEBUG_ENABLED || !debugOverlay) return;

  debugOverlay.classList.remove('hidden');

  const me = state?.players?.find(p => p.id === socket.id);

  debugOverlay.innerHTML = `
<strong>DEBUG STATE</strong>
socket.id: ${socket.id || '—'}
room: ${currentRoomCode || '—'}

roundActive: ${state?.roundActive}
gameOver: ${state?.gameOver}

currentTurn: ${state?.currentTurn || '—'}

me.alive: ${me?.alive}
me.spectator: ${me?.spectator}
isEliminated: ${appState.isEliminated}

wins: ${me?.wins ?? '—'}
`;
}


let turnDeadline = null;
let countdownInterval = null;
let nextRoundDeadline = null;

// reconnect token
let reconnectToken = localStorage.getItem('rb_reconnect_token') || null;

const createRoomBtn = document.getElementById('createRoomBtn');
const joinRoomBtn = document.getElementById('joinRoomBtn');

function setRoomButtonsDisabled(disabled) {
  if (createRoomBtn) createRoomBtn.disabled = disabled;
  if (joinRoomBtn) joinRoomBtn.disabled = disabled;
}


createRoomBtn && (createRoomBtn.onclick = () => {
  const name = nameInput.value.trim();
  pendingPlayerName = name;

  if (!name) {
    alert('Please enter your name');
    return;
  }

  setRoomButtonsDisabled(true);

  socket.emit('createRoom');

  unlockAudioOnce();
  play(clickSound);
});


joinRoomBtn && (joinRoomBtn.onclick = () => {
  const name = nameInput.value.trim();
  pendingPlayerName = name;

  const code = roomCodeInput.value.trim().toUpperCase();

  if (!name) {
    alert('Please enter your name');
    return;
  }

  if (!code) {
    alert('Please enter a room code');
    return;
  }

  // 🔧 IMPORTANT: disable buttons while waiting
  setRoomButtonsDisabled(true);

  socket.emit('joinRoom', code);
  play(clickSound);
});



readyBtn && (readyBtn.onclick = () => {
  socket.emit('toggleReady');
  play(clickSound);
});

cancelStartBtn && (cancelStartBtn.onclick = () => {
  socket.emit('toggleReady'); // host unreadies → cancels countdown
  play(clickSound);
});

startNewGameBtn && (startNewGameBtn.onclick = () => {
  if (appState.uiMode !== 'postgame') return;


  socket.emit('requestNewGame');
});


// ----------------- Helpers -----------------

function buildRoundSummaryHTML(summary) {
  const hasBusted = summary.busted?.length > 0;

  const bustedHTML = hasBusted
    ? summary.busted
        .map(b => `💥 ${escapeHTML(b.name)} (${b.value})`)
        .join('<br>')
    : 'None';

  const lowestHTML = summary.lowestSurvivor
    ? `⚖️ ${escapeHTML(summary.lowestSurvivor.name)} (${summary.lowestSurvivor.value})`
    : '—';

  const ruleLine = hasBusted
    ? '💥 Busting takes priority over lowest hand'
    : '⚖️ No one busted → lowest hand chosen';

  const outcome = summary.eliminated
    ? `💀 Eliminated (Roll ${summary.roll})`
    : `🟢 Survived (Roll ${summary.roll})`;

  return `
    <div class="round-summary-rule">${ruleLine}</div>

    <div class="round-summary-section">
      <div class="round-summary-title">Busted</div>
      <div>${bustedHTML}</div>
    </div>

    <div class="round-summary-section">
      <div class="round-summary-title">Lowest Hand</div>
      <div>${lowestHTML}</div>
    </div>

    <div class="round-summary-highlight">
      🎯 ${escapeHTML(summary.chosenLoser)} pulled the trigger<br>
      ${outcome}
    </div>
  `;
}


function escapeHTML(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function dangerLevel(player) {
  if (player.busted) return 'danger';

  const value = handValue(player.hand);

  if (value >= 18) return 'safe';
  if (value >= 15) return 'risky';
  return 'danger';
}

function renderWinnerBanner() {
  const el = document.getElementById('winnerBanner');
  if (!el || !appState.winner.name) return;

  el.textContent = `🏆 Winner: ${appState.winner.name}`;
  el.classList.remove('hidden');
}

function hideWinnerBanner() {
  const el = document.getElementById('winnerBanner');
  if (el) el.classList.add('hidden');
}


socket.on('connect', () => {
  mySocketId = socket.id;
  appState.isEliminated = false;

  // ❌ DO NOT auto-reconnect on fresh load
  // Reconnect is ONLY allowed after user joins a room
  console.log('[SOCKET] Connected — waiting for user action');
});




socket.on('roomJoined', data => {

  if (roomCodeInput) roomCodeInput.value = '';
  currentRoomCode = data.roomCode;

const roomCodeText = document.getElementById('roomCodeText');
if (roomCodeText) {
  roomCodeText.textContent = data.roomCode;
}


  setRoomButtonsDisabled(false);

  // ✅ Safe reconnect ONLY after user is in a room
if (reconnectToken) {
  try {
    socket.emit('identify', reconnectToken);
    console.log('[RECONNECT] Attempted after room join');
  } catch (e) {}
}

// ✅ Now that we are in a room, safely set the name
if (pendingPlayerName) {
  socket.emit('setName', pendingPlayerName);
  pendingPlayerName = null;
}


});

socket.on('roomError', msg => {
  alert(msg);
  setRoomButtonsDisabled(false);
});


socket.on('assignToken', data => {
  if (data?.token) {
    reconnectToken = data.token;
    try { localStorage.setItem('rb_reconnect_token', reconnectToken); } catch(e) {}
  }
});

function clearAllTimers() {
  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = null;

  if (nextRoundInterval) clearInterval(nextRoundInterval);
  nextRoundInterval = null;
}


function hidePostDeathPanel() {
  if (postDeathPanel) postDeathPanel.classList.add('hidden');
}


// ---------------- BUTTONS ----------------
copyRoomCodeBtn && (copyRoomCodeBtn.onclick = () => {
  const code = document.getElementById('roomCodeText')?.textContent;
  if (!code) return;

  navigator.clipboard.writeText(code);
  play(clickSound);

  const original = copyRoomCodeBtn.textContent;
  copyRoomCodeBtn.textContent = 'Copied!';
  setTimeout(() => {
    copyRoomCodeBtn.textContent = original;
  }, 1000);
});


leaveLobbyBtn && (leaveLobbyBtn.onclick = () => {
  cleanupAndReturnToIntro({ clearToken: true });
});



startBtn && (startBtn.onclick = () => {

  if (!readyCountdownActive) {
    // ▶ START
    socket.emit('startRound');
    play(clickSound);
  } else {
    // ❌ CANCEL
    socket.emit('toggleReady'); // host un-readies → cancels countdown
    play(clickSound);
  }
});

hitBtn && (hitBtn.onclick = () => {

  if (appState.isEliminated) return;
  if (actionLock) return;
  actionLock = true;
  socket.emit('hit');
  play(hitSound);
  setTimeout(() => actionLock = false, 500);
});

standBtn && (standBtn.onclick = () => {

  if (appState.isEliminated) return;
  if (actionLock) return;
  actionLock = true;
  socket.emit('stand');
  play(standSound);
  setTimeout(() => actionLock = false, 500);
});

// How-to handlers
if (howToPlayBtn) howToPlayBtn.addEventListener('click', showHowTo);
if (howToPlayBtnHeader) howToPlayBtnHeader.addEventListener('click', showHowTo);
if (howToClose) howToClose.addEventListener('click', hideHowTo);

// close with Esc
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    hideHowTo();
    
  }
});

function showHowTo() {
  trapFocus(howToOverlay);
  try {
    if (!howToOverlay) return;
    howToOverlay.classList.remove('hidden');
    howToOverlay.setAttribute('aria-hidden', 'false');
    // focus close button for keyboard users
    setTimeout(() => { try { howToClose && howToClose.focus(); } catch(e) {} }, 40);
  } catch (e) { console.error('showHowTo error', e); }
}
function hideHowTo() {
  try {
    if (!howToOverlay) return;
    howToOverlay.classList.add('hidden');
    howToOverlay.setAttribute('aria-hidden', 'true');
  } catch (e) { console.error('hideHowTo error', e); }
}

// ---------- Exit / Leave handler ----------
exitBtn && (exitBtn.onclick = () => {
  if (confirm('Leave the game? You may be eliminated.')) {
    cleanupAndReturnToIntro({ clearToken: true });
  }
});


function cleanupAndReturnToIntro({ clearToken = false } = {}) {
  // Winner is allowed to leave after victory
  clearAllTimers();
  try {
    hideDeathOverlay();
    hideRoundSummaryOverlay();
    hideWinnerBanner();
    hideWinnerSummary();
    hideVictoryOverlay();  

    appState.winner.id = null;
    appState.winner.name = null;

   if (appState.postGameCountdown) {
     clearInterval(appState.postGameCountdown);
     appState.postGameCountdown = null;
    } 



    try { hideGunAnimation(); } catch(e) {}
    try { hideHowTo(); } catch(e) {}

    if (clearToken) {
      try { localStorage.removeItem('rb_reconnect_token'); } catch(e) {}
      reconnectToken = null;
    }
    
    try { socket.emit('leave'); } catch(e) {}

    try {
      setScreen('intro');  

      debugOverlay?.classList.add('hidden');

      

      if (nameInput) nameInput.value = '';
      if (gameLog) gameLog.innerHTML = '';
      if (playersWrap) playersWrap.innerHTML = 'Waiting for players...';
      if (playerListDiv) playerListDiv.innerHTML = '';
      

      hitBtn && (hitBtn.disabled = true);
      standBtn && (standBtn.disabled = true);

      currentRoomCode = null;
      lastState = null;


      // clear eliminated flag on exit
      appState.isEliminated = false;

     resetSafeMode();
    } catch (e) {
      console.error('cleanup UI error', e);
    }
  } catch (err) {
    console.error('Error during cleanup:', err);
    try { location.reload(); } catch(e) {}
  }
}

function renderWinnerSummary() {
  const wrap = document.getElementById('winnerSummary');
  const body = document.getElementById('winnerSummaryBody');

  if (!wrap || !body) return;
  if (!appState.lastState || !appState.lastState.players) return;

  body.innerHTML = appState.lastState.players.map(p => `
    <div style="margin:4px 0;">
      ${escapeHTML(p.name)} — ${p.wins || 0} wins
    </div>
  `).join('');

  wrap.classList.remove('hidden');
  wrap.setAttribute('aria-hidden', 'false');
}

function hideWinnerSummary() {
  const wrap = document.getElementById('winnerSummary');
  if (!wrap) return;

  wrap.classList.add('hidden');
  wrap.setAttribute('aria-hidden', 'true');
}

// Post-death buttons
spectateBtn && (spectateBtn.onclick = () => {
  socket.emit('spectate');
  hidePostDeathPanel();
  appState.isEliminated = false;
});

backToLobbyBtn && (backToLobbyBtn.onclick = () => {
  hidePostDeathPanel();
  appState.isEliminated = false;
});

roundSummaryClose && roundSummaryClose.addEventListener('click', () => {
  hideRoundSummaryOverlay();
});

roundSummaryOverlay && roundSummaryOverlay.addEventListener('click', (e) => {
  // Only close when clicking the dark backdrop, not the modal itself
  if (e.target === roundSummaryOverlay) {
    hideRoundSummaryOverlay();
  }
});



// ======================
// TURN TIMER
// ======================
function startLocalCountdown(deadlineMs) {
  clearLocalCountdown();
  if (!deadlineMs) {
    turnTimerEl && (turnTimerEl.textContent = '--');
    return;
  }
  turnDeadline = deadlineMs;
  updateCountdown();
  countdownInterval = setInterval(updateCountdown, 500);
}
function updateCountdown() {
  if (!turnDeadline) {
    turnTimerEl && (turnTimerEl.textContent = '--');
    return;
  }
  const ms = Math.max(0, turnDeadline - Date.now());
  turnTimerEl && (turnTimerEl.textContent = Math.ceil(ms / 1000) + 's');
  if (ms <= 5000) {
    turnTimerEl && turnTimerEl.classList.add('warning');
    turnTimerEl && turnTimerEl.classList.remove('ok');
  } else {
    turnTimerEl && turnTimerEl.classList.remove('warning');
    turnTimerEl && turnTimerEl.classList.add('ok');
  }
  if (ms <= 0) clearLocalCountdown();
}
function clearLocalCountdown() {
  turnDeadline = null;
  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = null;
  turnTimerEl && (turnTimerEl.textContent = '--');
}

// ======================
// GUN ANIMATION & BLOOD etc
function showGunAnimation(text = 'Pulling the trigger...') {
  if (!gunOverlay || !gunText) return;

  // 🛑 CRITICAL: Never show gun animation if victory is active
  if (appState.victoryActive || appState.uiMode === 'postgame') {
    console.log('[GUN ANIMATION] Blocked - victory is active');
    return;
  }

  // HARD BLOCK everything else
  appState.triggerAnimationActive = true;

  // Hide anything that might already be visible
  hideRoundSummaryOverlay();

  gunOverlay.classList.remove('hidden');
  gunOverlay.setAttribute('aria-hidden', 'false');

  if (gunBarrel) gunBarrel.style.display = 'none';
  if (gunSmoke) gunSmoke.style.display = 'none';

  gunText.textContent = text;
  gunText.classList.add('trigger-text');

  // AUTHORITATIVE END OF TRIGGER PHASE
  setTimeout(() => {
  // 🛑 Check again before showing overlays (victory might have arrived)
  if (appState.victoryActive || appState.uiMode === 'postgame') {
    hideGunAnimation();
    appState.triggerAnimationActive = false;
    return; // Victory takes priority
  }

  hideGunAnimation();
  appState.triggerAnimationActive = false;


  
  if (queuedDeathData) {
  showDeathOverlay(
    queuedDeathData.winnerName || 'You have been eliminated',
    deathSound
  );
  queuedDeathData = null;
  return;
}

if (queuedRoundSummary) {
  // 🏆 Do not show summary if victory already happened
  if (appState.uiMode !== 'postgame' && !appState.winner.id) {
    showRoundSummaryOverlay(buildRoundSummaryHTML(queuedRoundSummary));
  }
  queuedRoundSummary = null;
}


}, 3500);

}


function hideGunAnimation() {
  if (!gunOverlay || !gunText) return;

  gunOverlay.classList.add('hidden');
  gunOverlay.setAttribute('aria-hidden', 'true');

  // Clean animation state
  gunText.classList.remove('trigger-text');
  gunText.textContent = '';

  if (gunBarrel) gunBarrel.style.animation = 'none';
  if (gunSmoke) gunSmoke.style.animation = 'none';
}
// ======================
// RENDERING
// ======================
function renderGame(state) {

  const status = document.getElementById('lobbyStatus');
if (status && !state.roundActive) {
  status.innerHTML =
    '⚠️ <strong>Busting</strong> is always worse than having the lowest hand.';
}


  const me = state.players?.find(p => p.id === socket.id);

// 🔒 If no player data, do nothing
if (!me) return;


  lastState = state;

  const roundStateEl = document.getElementById('roundState');
if (roundStateEl) {
  roundStateEl.textContent = state.roundActive
    ? 'Round in progress'
    : 'Waiting for next round';
}


  if (roundsCounterEl) roundsCounterEl.textContent = `Rounds: ${state.roundsPlayed}`;

  updateLobbyButtons(state.hostId);
updateLobbyBanner(state);
const startBtn = document.getElementById('startBtn');

const alivePlayers = (state.players || []).filter(p => p.alive && !p.spectator);

const hint = document.getElementById('minPlayersHint');
if (hint) {
  hint.style.display = alivePlayers.length < 2 ? 'block' : 'none';
}

if (startBtn) {
  startBtn.disabled = alivePlayers.length < 2;
}


const amTurn = state.currentTurn === socket.id;
const isSpectator = me?.spectator === true;

const isGameVisible = !game.classList.contains('hidden');

const controlsSection = document.getElementById('controls');
if (controlsSection) {
  controlsSection.style.display =
    isSpectator && isGameVisible ? 'none' : 'block';
}

  const yourTurnLabel = document.getElementById('yourTurnLabel');
if (yourTurnLabel) {
  yourTurnLabel.style.display = amTurn && state.roundActive
    ? 'block'
    : 'none';
}

  if (hitBtn) hitBtn.disabled = !(amTurn && state.roundActive);
  if (standBtn) standBtn.disabled = !(amTurn && state.roundActive);
renderPlayers({
  state,
  playersWrap,
  escapeHTML,
  handValue,
  dangerLevel
});

}

function handValue(hand) {
  let t = 0, a = 0;
  for (const c of (hand||[])) {
    if (!c) continue;
    if (c.rank === "A") { a++; t += 11; }
    else if (["K","Q","J"].includes(c.rank)) t += 10;
    else {
      const v = parseInt(c.rank, 10);
      t += Number.isFinite(v) ? v : 0;
    }
  }
  while (t > 21 && a > 0){ t -= 10; a--; }
  return t;
}

// ----------------- Logs -----------------
socket.on('log', msg => {


  try {
    const el = document.createElement('div');
    el.textContent = '• ' + msg;
    if (gameLog) gameLog.prepend(el);

    if (msg.includes('is now the host')) {
  gameLog?.firstChild?.classList.add('host-change');
}

    if (String(msg).toUpperCase().includes("ELIMINATED")) {
  if (!window._BLACKJACK_SAFE_MODE) {
    const prefersReducedMotion =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion) {
      document.body.classList.add('flash');
      setTimeout(() => document.body.classList.remove('flash'), 300);
    }

    try { play(gunSound); } catch (e) {}
  }
}
  } catch (e) { console.error('log handler error', e); }
});

// ----------------- Socket events -----------------
socket.on('playerList', list => {
  renderLobbyPlayers({
    list,
    playerListDiv,
    playersHeader,
    escapeHTML,
    winnerId: appState.winner.id
  });
});

socket.on('phaseChange', ({ phase }) => {
  console.log('[PHASE]', phase);

  // 🛑 CRITICAL: Never override victory/postgame mode unless explicitly resetting
  if (appState.victoryActive && phase !== 'lobby') {
    console.log('[PHASE] Blocked phase change during victory:', phase);
    return;
  }

  switch (phase) {
    case 'lobby':
      // Only allow lobby transition if victory is complete or not active
      appState.uiMode = 'lobby';
      appState.isEliminated = false;
      setScreen('lobby');
      break;

    case 'round':
      nextRoundDeadline = null;
if (nextRoundInterval) {
  clearInterval(nextRoundInterval);
  nextRoundInterval = null;
}
      setScreen('game');
      break;

    case 'trigger':
      setScreen('game');
      break;

    case 'postgame':
  appState.uiMode = 'postgame';
  setScreen('postgame');
  break;

  }
});

socket.on('state', state => {
  lastState = state;
  appState.lastState = state;

  updateDebugOverlay(state);

  const me = state.players.find(p => p.id === socket.id);
  if (!me) return;

  renderGame(state);
});


socket.on('turnDeadline', data => {
  if (nextRoundDeadline) return;

if (!data || !data.deadline) {
  clearLocalCountdown();
} else {
  startLocalCountdown(data.deadline);
}
});

// ======================
// TRIGGER / VICTORY / ELIMINATED events
// ======================
socket.on('triggerPull', data => {
  // 🛑 Never show trigger animation if victory is active
  if (appState.victoryActive || appState.uiMode === 'postgame') {
    console.log('[TRIGGER PULL] Blocked - victory is active');
    return;
  }
  if (!canShowGameOverlays()) return;
  showGunAnimation(`${data.loserName || 'Player'} is pulling the trigger...`);
});


socket.on('victory', ({ winnerId, winnerName }) => {
  console.log('[CLIENT] Victory received:', winnerName);

  // 🔒 CRITICAL: Force victory mode FIRST to block all other UI
  appState.uiMode = 'postgame';
  appState.victoryActive = true;
  appState.winner = { id: winnerId, name: winnerName };

  // 🔥 FORCE HIDE all competing overlays and animations
  hideDeathOverlay();
  hideRoundSummaryOverlay();
  hideGunAnimation(); // Force hide gun animation if active
  appState.triggerAnimationActive = false; // Clear trigger lock
  
  // Clear any queued overlays that might interfere
  queuedDeathData = null;
  queuedRoundSummary = null;

  // Force screen ownership - victory takes priority
  setScreen('postgame');

  // 🔥 SHOW FULL WIN OVERLAY (with highest priority)
  showVictoryOverlay(winnerName);
});

socket.on('gameReset', () => {
  console.log('[CLIENT] Game reset received');

  // 🔒 Force clear victory state
  appState.winner = { id: null, name: null };
  appState.victoryActive = false;
  appState.isEliminated = false;
  appState.uiMode = 'lobby'; // Explicitly set to lobby

  // Clear all queued overlays
  queuedDeathData = null;
  queuedRoundSummary = null;

  // Hide all overlays
  hideDeathOverlay();
  hideRoundSummaryOverlay();
  hideWinnerBanner();
  hideWinnerSummary();
  hideVictoryOverlay(); // Ensure victory overlay is closed

  // Clear all timers
  clearAllTimers();

  // 🔥 Force transition to lobby screen
  setScreen('lobby');

  // Re-enable lobby logic
  readyCountdownActive = false;

  console.log('[CLIENT] UI fully reset to lobby');
});



socket.on('eliminated', data => {
  // 🛑 Never process elimination if victory is active
  if (appState.victoryActive || appState.uiMode === 'postgame') {
    console.log('[ELIMINATED] Blocked - victory is active');
    return;
  }
  if (!canShowGameOverlays()) return;

  appState.isEliminated = true;   // ✅ ADD THIS

  queuedDeathData = {
    winnerName: data?.winnerName || '—'
  };
});


socket.on('readyCountdown', data => {
  if (!readyCountdownEl) return;

  // ⛔ Countdown stopped
  if (!data.endsAt) {
    readyCountdownEl.textContent = '';
    readyCountdownActive = false;

    if (startBtn) {
      startBtn.textContent = 'Start Round';
      startBtn.classList.remove('cancel');
    }

    if (readyCountdownInterval) {
      clearInterval(readyCountdownInterval);
      readyCountdownInterval = null;
    }
    return;
  }

  // ▶ Countdown active
  readyCountdownActive = true;

  if (startBtn) {
    startBtn.textContent = 'Cancel Start';
    startBtn.classList.add('cancel');
  }

  const update = () => {
    const ms = Math.max(0, data.endsAt - Date.now());
    readyCountdownEl.textContent =
      `Game starts in ${Math.ceil(ms / 1000)}s`;
  };

  update();
  readyCountdownInterval = setInterval(update, 500);
});

socket.on('nextRoundCountdown', data => {
  if (!turnTimerEl) return;

  // Countdown cancelled
  if (!data || !data.endsAt) {
    nextRoundDeadline = null;
    turnTimerEl.textContent = '--';
    turnTimerEl.classList.remove('warning');
    return;
  }

  nextRoundDeadline = data.endsAt;

  const update = () => {
    const ms = Math.max(0, nextRoundDeadline - Date.now());
    const s = Math.ceil(ms / 1000);

    turnTimerEl.textContent = `Next round in: ${s}s`;
    turnTimerEl.classList.add('warning');

    if (ms <= 0) {
      nextRoundDeadline = null;
      turnTimerEl.textContent = '--';
      turnTimerEl.classList.remove('warning');
      clearInterval(nextRoundInterval);
      nextRoundInterval = null;
    }
  };

  update();

  if (nextRoundInterval) clearInterval(nextRoundInterval);
  nextRoundInterval = setInterval(update, 500);
});

// ----------------- Round Summary listener (IGNORED if eliminated) -----------------
socket.on('roundSummary', summary => {
  // 🛑 CRITICAL: Never show round summary if victory is active
  if (appState.victoryActive || appState.uiMode === 'postgame') {
    console.log('[ROUND SUMMARY] Blocked - victory is active');
    return;
  }
  if (appState.winner.id) return;

  if (!canShowGameOverlays()) return;
  if (appState.isEliminated) return;

  // 🏆 IF GAME IS OVER / WINNER EXISTS → DO NOT SHOW SUMMARY
  if (appState.uiMode === 'postgame' || appState.winner.id) {
    console.log('[ROUND SUMMARY] Skipped because game is over');
    return;
  }

  queuedRoundSummary = summary;
});

// ----------------- Small UI helpers -----------------
function updateLobbyButtons(hostId) {
  if (readyCountdownActive) return;
  const hostPanel = document.getElementById('hostControls');
  const readyPanel = document.getElementById('readyControls');

  // Always hide everything first
  hostPanel?.classList.add('hidden');
  readyPanel?.classList.add('hidden');


  if (!lastState || !Array.isArray(lastState.players)) return;

  const me = lastState.players.find(p => p.id === socket.id);
  if (!me) return;

  // ❌ SPECTATOR OR DEAD → NO CONTROLS, EVER
  if (me.spectator || !me.alive) {
    return;
  }

  // 🟡 HOST (alive only)
  if (me.host && hostId === socket.id) {
    hostPanel?.classList.remove('hidden');
    return;
  }

  // 🟢 NORMAL PLAYER
  readyPanel?.classList.remove('hidden');
}


function updateLobbyBanner(state) {

  const status = document.getElementById('lobbyStatus');
  if (!status || !state) return;

  if (state.hostId === socket.id) {
    status.textContent = 'You are the host. Start the round when ready.';
  } else {
    status.textContent = 'Waiting for host to start the game...';
  }
}

/* ---------------------------------------------------
   START / STOP functions for integration (added)
   - startBlackjackMinigame(playersList, hostId, options)
   - stopBlackjackMinigame()
   These let the main party UI turn your minigame on/off.
   options: { safeMode: true/false }
--------------------------------------------------- */
window.startBlackjackMinigame = function(playersList, hostId, options = {}) {
  try {
    window._BLACKJACK_SAFE_MODE = !!(options && options.safeMode);

    if (intro) intro.classList.add('hidden');
    if (lobby) lobby.classList.remove('hidden');

    if (playerListDiv) {
      playerListDiv.innerHTML = (playersList || []).map(p =>
        `<div>${escapeHTML(p.name)}${p.id === hostId ? " ⭐" : ""}</div>`
      ).join('');
    }

    lastState = lastState || {};
    lastState.hostId = hostId;

    console.log("Blackjack minigame started with players:", playersList, "safeMode:", window._BLACKJACK_SAFE_MODE);
  } catch (e) {
    console.error('startBlackjackMinigame error', e);
  }
};

window.stopBlackjackMinigame = function() {
  try {
    cleanupAndReturnToIntro({ clearToken: false });
    console.log('Blackjack minigame stopped.');
  } catch (e) {
    console.error('stopBlackjackMinigame error', e);
  }
};
/* --------------------------------------------------- */

(function initUI() {
  try {
    // HARD RESET: only intro screen is allowed on load
    setScreen('intro');


    // Disable gameplay controls
    hitBtn && (hitBtn.disabled = true);
    standBtn && (standBtn.disabled = true);

    // Reset state
    currentRoomCode = null;
    lastState = null;
    appState.isEliminated = false;


    console.log('[INIT] UI hard reset complete');
  } catch (e) {
    console.error('initUI error', e);
  }
})();

// =======================================
// BFCache HARD RESET 
// =======================================
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    console.warn('[BFCache] Page restored from cache — forcing hard UI reset');

    try {
      // kill all state
      currentRoomCode = null;
      lastState = null;
      appState.isEliminated = false;

      // FORCE screen visibility
      intro && intro.classList.remove('hidden');
      lobby && lobby.classList.add('hidden');
      game && game.classList.add('hidden');


      // buttons
      hitBtn && (hitBtn.disabled = true);
      standBtn && (standBtn.disabled = true);

      console.warn('[BFCache] UI forcibly reset');
    } catch (e) {
      console.error('[BFCache] reset failed', e);
    }
  }
});
// Only expose debug helpers in development mode
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  window._rb = {
    cleanup: cleanupAndReturnToIntro,
    showGunAnimation,
    hideGunAnimation,
    showHowTo,
    hideHowTo
  };
}

window.addEventListener('victoryOverlayClosed', () => {
  if (appState.uiMode !== 'postgame') return;
  
  // Show winner summary if needed
  renderWinnerBanner();
  renderWinnerSummary();
  
  // 🔄 Auto-transition to lobby after 8 seconds
  // The server will emit gameReset after 8 seconds, but we ensure UI is ready
  // If gameReset hasn't arrived yet, wait for it (it should arrive within ~100ms)
  // This ensures smooth transition without race conditions
});
