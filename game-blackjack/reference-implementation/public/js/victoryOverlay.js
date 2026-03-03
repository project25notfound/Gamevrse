// ui/victoryOverlay.js - COMPLETE READY-TO-USE FILE
import { trapFocus } from './focusTrap.js';
import { play, clickSound } from './audio.js';
import { state } from '../state.js';

const victoryOverlay = document.getElementById('victoryOverlay');
const victoryNameEl = document.getElementById('victoryName');
const victoryClose = document.getElementById('victoryClose');
const confettiContainer = document.getElementById('confettiContainer');

let confettiInterval = null;
let autoCloseTimer = null;

export function showVictoryOverlay(winnerName) {
  document.body.classList.add('modal-open');

  console.log('[VICTORY OVERLAY] Showing for:', winnerName);
  
  if (!victoryOverlay || !victoryNameEl) {
    console.error('[VICTORY OVERLAY] Elements not found!');
    return;
  }

  victoryNameEl.textContent = winnerName;
  victoryOverlay.classList.remove('hidden');
  victoryOverlay.setAttribute('aria-hidden', 'false');
  trapFocus(victoryOverlay); 

  startConfetti();


  document.body.classList.add('victory-active');

  setTimeout(() => {
    if (victoryClose) victoryClose.focus();
  }, 100);

  if (autoCloseTimer) clearTimeout(autoCloseTimer);
  autoCloseTimer = setTimeout(() => {
    hideVictoryOverlay();
    // 🔄 Auto-transition to lobby after overlay closes
    // This will be handled by the victoryOverlayClosed event listener
  }, 8000);
}

export function hideVictoryOverlay() {
  console.log('[VICTORY OVERLAY] Hiding');

  if (!victoryOverlay) return;

  // 🔓 RELEASE UI OWNERSHIP
  state.victoryActive = false;

  // Fix aria-hidden focus bug
  if (victoryOverlay.contains(document.activeElement)) {
    document.activeElement.blur();
  }

  victoryOverlay.classList.add('hidden');
  victoryOverlay.setAttribute('aria-hidden', 'true');

  if (autoCloseTimer) {
    clearTimeout(autoCloseTimer);
    autoCloseTimer = null;
  }

  stopConfetti();

  window.dispatchEvent(new Event('victoryOverlayClosed'));
  document.body.classList.remove('modal-open');
  document.body.classList.remove('victory-active');
}

function startConfetti() {
  if (!confettiContainer) return;

  confettiContainer.innerHTML = '';

  const colors = ['#ffd966', '#ff6b6b', '#4ecdc4', '#45b7d1', '#f7b731', '#ff9ff3'];

  confettiInterval = setInterval(() => {
    for (let i = 0; i < 3; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDelay = Math.random() * 0.5 + 's';
      confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
      
      const size = Math.random() * 6 + 4;
      confetti.style.width = size + 'px';
      confetti.style.height = size + 'px';
      
      confettiContainer.appendChild(confetti);

      setTimeout(() => {
        if (confetti.parentNode) confetti.remove();
      }, 4000);
    }
  }, 150);
}

function stopConfetti() {
  if (confettiInterval) {
    clearInterval(confettiInterval);
    confettiInterval = null;
  }
  if (confettiContainer) confettiContainer.innerHTML = '';
}

if (victoryClose) {
  victoryClose.addEventListener('click', () => {
    hideVictoryOverlay();

    play(clickSound);
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && victoryOverlay && !victoryOverlay.classList.contains('hidden')) {
    hideVictoryOverlay();
  }
});

if (victoryOverlay) {
  victoryOverlay.addEventListener('click', (e) => {
    if (e.target === victoryOverlay) {
      hideVictoryOverlay();
    }
  });
}


