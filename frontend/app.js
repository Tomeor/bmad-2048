'use strict';

// === GAME ENGINE ===

const state = {
  board: [],
  score: 0,
  bestScore: 0,
  gameOver: false,
};

function initGame() {
  state.board = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  state.score = 0;
  state.gameOver = false;
  state.bestScore = parseInt(localStorage.getItem('bestScore') || '0', 10);

  spawnTile();
  spawnTile();
  renderBoard();
  updateScoreDisplay();

  // Cacher la modale si visible (utilisé aussi par "Rejouer" en Story 2.3)
  document.getElementById('game-over-modal').setAttribute('hidden', '');
}

function getEmptyCells() {
  const cells = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (state.board[r][c] === 0) cells.push({ r, c });
    }
  }
  return cells;
}

function spawnTile() {
  const empty = getEmptyCells();
  if (empty.length === 0) return;
  const { r, c } = empty[Math.floor(Math.random() * empty.length)];
  state.board[r][c] = Math.random() < 0.9 ? 2 : 4;
}

// Compresse un tableau 1D vers la gauche (retire les zéros)
function slideRow(row) {
  return row.filter(v => v !== 0).concat([0, 0, 0, 0]).slice(0, 4);
}

// Fusionne les paires adjacentes identiques de gauche à droite — une seule fois par paire
function mergeRow(row) {
  let gained = 0;
  const result = [...row];
  for (let i = 0; i < 3; i++) {
    if (result[i] !== 0 && result[i] === result[i + 1]) {
      result[i] *= 2;
      gained += result[i];
      result[i + 1] = 0;
      i++; // sauter la tuile consommée pour éviter une double fusion
    }
  }
  return { row: result, gained };
}

function processRow(row) {
  const slid = slideRow(row);
  const { row: merged, gained } = mergeRow(slid);
  return { result: slideRow(merged), gained };
}

function cloneBoard(board) {
  return board.map(row => [...row]);
}

function boardsEqual(a, b) {
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
      if (a[r][c] !== b[r][c]) return false;
  return true;
}

function moveLeft() {
  let totalGained = 0;
  const newBoard = [];
  for (let r = 0; r < 4; r++) {
    const { result, gained } = processRow([...state.board[r]]);
    newBoard.push(result);
    totalGained += gained;
  }
  return { newBoard, gained: totalGained };
}

function moveRight() {
  let totalGained = 0;
  const newBoard = [];
  for (let r = 0; r < 4; r++) {
    const reversed = [...state.board[r]].reverse();
    const { result, gained } = processRow(reversed);
    newBoard.push([...result].reverse());
    totalGained += gained;
  }
  return { newBoard, gained: totalGained };
}

function moveUp() {
  let totalGained = 0;
  const newBoard = cloneBoard(state.board);
  for (let c = 0; c < 4; c++) {
    const col = [state.board[0][c], state.board[1][c], state.board[2][c], state.board[3][c]];
    const { result, gained } = processRow(col);
    for (let r = 0; r < 4; r++) newBoard[r][c] = result[r];
    totalGained += gained;
  }
  return { newBoard, gained: totalGained };
}

function moveDown() {
  let totalGained = 0;
  const newBoard = cloneBoard(state.board);
  for (let c = 0; c < 4; c++) {
    const col = [state.board[3][c], state.board[2][c], state.board[1][c], state.board[0][c]];
    const { result, gained } = processRow(col);
    const flipped = [...result].reverse();
    for (let r = 0; r < 4; r++) newBoard[r][c] = flipped[r];
    totalGained += gained;
  }
  return { newBoard, gained: totalGained };
}

function isGameOver() {
  if (getEmptyCells().length > 0) return false;
  // Vérifier fusions horizontales
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 3; c++)
      if (state.board[r][c] === state.board[r][c + 1]) return false;
  // Vérifier fusions verticales
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 4; c++)
      if (state.board[r][c] === state.board[r + 1][c]) return false;
  return true;
}

function move(direction) {
  if (state.gameOver) return;

  const prev = cloneBoard(state.board);
  let result;

  switch (direction) {
    case 'left':  result = moveLeft();  break;
    case 'right': result = moveRight(); break;
    case 'up':    result = moveUp();    break;
    case 'down':  result = moveDown();  break;
    default: return;
  }

  // Mouvement invalide : board inchangé → rien ne se passe, pas de spawn
  if (boardsEqual(prev, result.newBoard)) return;

  state.board = result.newBoard;
  if (result.gained > 0) updateScore(result.gained);

  spawnTile();
  renderBoard();

  if (isGameOver()) {
    state.gameOver = true;
    showGameOver();
  }
}

// === DOM ===

function renderBoard() {
  const cells = document.querySelectorAll('#game-grid .cell');
  cells.forEach((cell, index) => {
    const r = Math.floor(index / 4);
    const c = index % 4;
    const value = state.board[r][c];

    cell.innerHTML = '';

    if (value !== 0) {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.dataset.value = value;
      tile.textContent = value;
      cell.appendChild(tile);
    }
  });
}

function updateScore(gained) {
  state.score += gained;
  document.getElementById('score-display').textContent = state.score;

  // Micro-animation "+N" au-dessus du score (UX-DR4)
  const scoreBox = document.getElementById('score-box');
  const delta = document.createElement('span');
  delta.className = 'score-delta';
  delta.textContent = '+' + gained;
  scoreBox.appendChild(delta);
  delta.addEventListener('animationend', () => delta.remove());

  // Mise à jour du meilleur score si dépassé (FR5)
  if (state.score > state.bestScore) {
    state.bestScore = state.score;
    localStorage.setItem('bestScore', String(state.bestScore));
    document.getElementById('best-score-display').textContent = state.bestScore;
  }
}

function updateScoreDisplay() {
  document.getElementById('score-display').textContent = state.score;
  document.getElementById('best-score-display').textContent = state.bestScore;
}

function showGameOver() {
  document.getElementById('modal-score-display').textContent = state.score;
  document.getElementById('game-over-modal').removeAttribute('hidden');
}

// === API ===

// --- Leaderboard ---

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function loadLeaderboard() {
  try {
    const res = await fetch('/scores/top10');
    if (!res.ok) throw new Error(res.status);
    const entries = await res.json();
    renderLeaderboard(entries);
  } catch (e) {
    renderLeaderboardError();
  }
}

function renderLeaderboard(entries) {
  const list = document.getElementById('leaderboard-list');
  if (entries.length === 0) {
    list.innerHTML = '<li class="leaderboard-empty">Sois le premier !</li>';
    return;
  }
  const medals = ['🥇', '🥈', '🥉'];
  list.innerHTML = entries.map((entry, i) => {
    const rank = medals[i] ?? `${i + 1}`;
    const date = new Date(entry.created_at).toLocaleDateString('fr-FR');
    return `<li class="leaderboard-row">
      <span class="leaderboard-rank">${rank}</span>
      <span class="leaderboard-pseudo">${escapeHtml(entry.pseudo)}</span>
      <span class="leaderboard-score">${entry.score}</span>
      <span class="leaderboard-date">${date}</span>
    </li>`;
  }).join('');
}

function renderLeaderboardError() {
  const list = document.getElementById('leaderboard-list');
  list.innerHTML = '<li class="leaderboard-error">Classement indisponible</li>';
}

// --- Score submission ---

async function submitScore() {
  const pseudo = document.getElementById('pseudo-input').value.trim() || null;
  const score = state.score;

  // Loading state
  const btn = document.getElementById('submit-score-btn');
  btn.disabled = true;
  btn.textContent = 'Enregistrement…';

  // Reset error state (au cas où retry)
  document.getElementById('modal-error').setAttribute('hidden', '');
  document.getElementById('retry-btn').setAttribute('hidden', '');

  try {
    const res = await fetch('/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pseudo, score }),
    });
    if (!res.ok) throw new Error(res.status);
    const { rank } = await res.json();

    // Show rank
    const rankDisplay = document.getElementById('modal-rank-display');
    rankDisplay.textContent = `Tu es classé N° ${rank} !`;
    rankDisplay.removeAttribute('hidden');

    // Bouton reste disabled — score déjà soumis
    btn.textContent = 'Score enregistré ✓';

    // Refresh leaderboard puis highlight nouvelle entrée
    await loadLeaderboard();
    highlightLeaderboardEntry(rank);

    // Afficher le leaderboard sur mobile (FR13)
    document.querySelector('.leaderboard-section').classList.add('visible');

  } catch (e) {
    btn.disabled = false;
    btn.textContent = 'Enregistrer mon score';
    document.getElementById('modal-error').removeAttribute('hidden');
    document.getElementById('retry-btn').removeAttribute('hidden');
  }
}

function highlightLeaderboardEntry(rank) {
  const rows = document.getElementById('leaderboard-list').querySelectorAll('.leaderboard-row');
  const target = rows[rank - 1];
  if (target) target.classList.add('highlight');
}

function resetModal() {
  const btn = document.getElementById('submit-score-btn');
  btn.disabled = false;
  btn.textContent = 'Enregistrer mon score';
  document.getElementById('pseudo-input').value = '';
  document.getElementById('modal-rank-display').setAttribute('hidden', '');
  document.getElementById('modal-error').setAttribute('hidden', '');
  document.getElementById('retry-btn').setAttribute('hidden', '');
  document.querySelector('.leaderboard-section').classList.remove('visible');
  document.body.focus(); // retour focus page après fermeture modale
}

// Listeners soumission
document.getElementById('submit-score-btn').addEventListener('click', submitScore);
document.getElementById('retry-btn').addEventListener('click', submitScore);
document.getElementById('pseudo-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') submitScore();
});

// Rejouer — réinitialise état modal + masque leaderboard mobile
// (second listener; initGame() dans CONTROLS gère la fermeture de la modale)
document.getElementById('restart-btn').addEventListener('click', resetModal);
document.getElementById('modal-restart-btn').addEventListener('click', resetModal);

// Focus trap — modale (UX-DR5, UX-DR11)
const _modal = document.getElementById('game-over-modal');
const _focusable = 'input:not([disabled]), button:not([hidden]):not([disabled])';

new MutationObserver(() => {
  if (!_modal.hasAttribute('hidden')) {
    const first = _modal.querySelector(_focusable);
    if (first) first.focus();
  }
}).observe(_modal, { attributes: true, attributeFilter: ['hidden'] });

_modal.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab') return;
  const focusable = [..._modal.querySelectorAll(_focusable)];
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey) {
    if (document.activeElement === first) { e.preventDefault(); last.focus(); }
  } else {
    if (document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

// === CONTROLS ===

// --- Clavier (desktop) ---
document.addEventListener('keydown', (e) => {
  const directions = {
    ArrowLeft:  'left',
    ArrowRight: 'right',
    ArrowUp:    'up',
    ArrowDown:  'down',
  };
  const direction = directions[e.key];
  if (!direction) return;
  e.preventDefault(); // empêche le scroll natif sur les flèches
  move(direction);
});

// --- Swipe tactile (mobile) ---
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].clientX;
  touchStartY = e.changedTouches[0].clientY;
}, { passive: true });

document.addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (Math.max(absDx, absDy) < 30) return; // micro-tap ou geste trop court

  if (absDx > absDy) {
    move(dx > 0 ? 'right' : 'left');
  } else {
    move(dy > 0 ? 'down' : 'up');
  }
}, { passive: true });

// --- Boutons Rejouer ---
document.getElementById('restart-btn').addEventListener('click', initGame);
document.getElementById('modal-restart-btn').addEventListener('click', initGame);

// === INIT ===
// defer garantit que le DOM est prêt — pas besoin de DOMContentLoaded
initGame();
loadLeaderboard();
document.body.focus(); // focus page — clavier immédiat sans clic
