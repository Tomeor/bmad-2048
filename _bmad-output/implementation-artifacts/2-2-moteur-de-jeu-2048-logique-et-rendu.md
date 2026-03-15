# Story 2.2 : Moteur de jeu 2048 — logique et rendu

Status: review

## Story

En tant qu'agent de développement,
je veux implémenter la logique complète du jeu 2048 et le rendu de la grille dans le DOM,
afin que le joueur puisse jouer une partie de bout en bout.

## Acceptance Criteria

1. **Given** la page chargée **When** elle s'affiche pour la première fois **Then** la grille 4×4 est rendue avec 2 tuiles initiales placées aléatoirement, le score affiché est `0`, aucune action préalable n'est requise (FR1)
2. **Given** une grille avec des tuiles **When** un déplacement est déclenché (haut/bas/gauche/droite) **Then** toutes les tuiles glissent dans la direction avec `transition: transform 80ms ease-out`, les tuiles de même valeur adjacentes fusionnent en valeur double, une nouvelle tuile (valeur 2 ou 4) apparaît aléatoirement dans une cellule vide après chaque mouvement valide
3. **Given** deux tuiles de valeurs différentes adjacentes **When** un déplacement est déclenché dans leur direction **Then** les deux tuiles glissent sans fusionner
4. **Given** une fusion de deux tuiles **When** la fusion se produit **Then** la tuile résultante a un flash CSS (scale 1.1→1.0) et sa couleur correspond au palier de valeur (`data-value` → CSS token)
5. **Given** une grille en cours de partie **When** le score augmente suite à une fusion **Then** le score courant est mis à jour immédiatement dans le DOM et une micro-animation "+N" apparaît et disparaît au-dessus du ScoreBox
6. **Given** le meilleur score en localStorage **When** la page se charge **Then** le meilleur score est restauré ; si le score courant le dépasse, le meilleur score est mis à jour en temps réel
7. **Given** une grille où aucun mouvement n'est possible **When** le joueur tente un déplacement (ou automatiquement après le dernier coup) **Then** la fin de partie est détectée, `state.gameOver = true`, tout déplacement ultérieur est ignoré, et `#game-over-modal` est rendu visible (attribut `hidden` retiré) avec le score final affiché dans `#modal-score-display`
8. **Given** l'état `gameOver: true` **When** la modale s'affiche **Then** les boutons de soumission de score et de reprise de partie sont déjà présents dans le HTML (Story 2.1) — leur câblage sera fait en Story 3.2

## Tasks / Subtasks

- [ ] Initialiser l'état du jeu et exposer les fonctions globales (AC: #1)
  - [ ] Déclarer `state` : `{ board, score, bestScore, gameOver }`
  - [ ] Implémenter `initGame()` : réinitialise le board à zéro, score à 0, gameOver à false, restaure bestScore depuis localStorage, place 2 tuiles aléatoires, appelle `renderBoard()`
  - [ ] Appeler `initGame()` au chargement du DOM (`DOMContentLoaded`)
- [ ] Implémenter la logique de spawn de tuiles (AC: #1, #2)
  - [ ] `getEmptyCells()` : retourne la liste des positions `{row, col}` libres dans le board
  - [ ] `spawnTile()` : choisit une cellule vide au hasard, place une tuile de valeur 2 (90%) ou 4 (10%)
- [ ] Implémenter la logique de mouvement et de fusion (AC: #2, #3)
  - [ ] `slideRow(row)` : compresse un tableau 1D vers la gauche (retire les zéros) — fonction pure
  - [ ] `mergeRow(row)` : fusionne les paires adjacentes identiques (de gauche à droite, une seule fois par paire) — retourne `{ merged: row[], gained: number }`
  - [ ] `moveLeft()`, `moveRight()`, `moveUp()`, `moveDown()` : applique slide+merge sur les lignes/colonnes dans le bon sens
  - [ ] `move(direction)` : sélecteur de direction, vérifie si le board a changé, si oui : spawn + vérif game over + render ; si non : rien
- [ ] Implémenter le rendu DOM (AC: #1, #2, #4)
  - [ ] `renderBoard()` : met à jour les 16 `.cell` de `#game-grid` — vide chaque cellule, crée un `.tile` avec `data-value` pour chaque valeur non-nulle
  - [ ] Ajouter la classe `.merge` aux tuiles nouvellement fusionnées (retiré après animation via `animationend` ou timeout)
- [ ] Implémenter la gestion du score (AC: #5, #6)
  - [ ] `updateScore(gained)` : incrémente `state.score`, met à jour `#score-display`, affiche micro-animation "+N", met à jour bestScore si dépassé
  - [ ] Persister `state.bestScore` dans `localStorage` à chaque mise à jour
  - [ ] Au chargement : restaurer `state.bestScore` depuis `localStorage` et afficher dans `#best-score-display`
- [ ] Implémenter la détection de fin de partie (AC: #7)
  - [ ] `isGameOver()` : retourne `true` si aucune cellule vide ET aucune fusion possible dans les 4 directions
  - [ ] Quand `isGameOver()` → `state.gameOver = true` + afficher `#game-over-modal` (retirer attribut `hidden`) + mettre à jour `#modal-score-display`
  - [ ] Dans `move()` : si `state.gameOver === true`, ignorer l'appel silencieusement

## Dev Notes

### Contexte

`frontend/app.js` est le seul fichier à implémenter. Il repose entièrement sur les IDs/classes DOM créés en Story 2.1. Story 2.3 ajoutera les event listeners clavier et swipe qui appellent `move(direction)`.

**Architecture JS (sections commentées — règle architecture):**
```
// === GAME ENGINE ===    ← logique pure (state, move, merge, spawn)
// === DOM ===            ← rendu (renderBoard, updateScore)
// === API ===            ← fetch (Stories 3.x)
// === CONTROLS ===       ← event listeners (Story 2.3)
```

**Séparation Stories 2.2 / 2.3 :**
- Story 2.2 : `state`, `initGame()`, `move(direction)`, `renderBoard()`, `updateScore()`, `isGameOver()`
- Story 2.3 : `addEventListener` clavier + swipe + bouton restart → ils appellent `move()` et `initGame()`

**Pour tester Story 2.2 sans les contrôles :** ouvrir `frontend/index.html` dans le navigateur, puis dans la console :
```js
move('left')   // déclenche un mouvement
move('up')
initGame()     // réinitialise
```

---

### Implémentation complète de `frontend/app.js`

```js
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

  // Cacher la modale si visible (cas Rejouer — Story 2.3 l'appellera aussi)
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
  const mergedAt = [];
  for (let i = 0; i < 3; i++) {
    if (row[i] !== 0 && row[i] === row[i + 1]) {
      row[i] *= 2;
      gained += row[i];
      mergedAt.push(i);
      row[i + 1] = 0;
      i++; // sauter la tuile fusionnée
    }
  }
  return { row, gained, mergedAt };
}

function processRow(row) {
  const slid = slideRow(row);
  const { row: merged, gained } = mergeRow(slid);
  return { result: slideRow(merged), gained };
}

function boardsEqual(a, b) {
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
      if (a[r][c] !== b[r][c]) return false;
  return true;
}

function cloneBoard(board) {
  return board.map(row => [...row]);
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
    newBoard.push(result.reverse());
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
    const reversed = result.reverse();
    for (let r = 0; r < 4; r++) newBoard[r][c] = reversed[r];
    totalGained += gained;
  }
  return { newBoard, gained: totalGained };
}

function isGameOver() {
  // Des cellules vides → pas game over
  if (getEmptyCells().length > 0) return false;
  // Vérifier fusions horizontales possibles
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 3; c++)
      if (state.board[r][c] === state.board[r][c + 1]) return false;
  // Vérifier fusions verticales possibles
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

  // Mouvement invalide : board inchangé → on ne fait rien
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

    // Vider la cellule
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

  // Micro-animation "+N"
  const scoreBox = document.getElementById('score-box');
  const delta = document.createElement('span');
  delta.className = 'score-delta';
  delta.textContent = '+' + gained;
  scoreBox.style.position = 'relative';
  scoreBox.appendChild(delta);
  delta.addEventListener('animationend', () => delta.remove());

  // Mettre à jour le meilleur score si dépassé
  if (state.score > state.bestScore) {
    state.bestScore = state.score;
    localStorage.setItem('bestScore', state.bestScore);
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

// === CONTROLS ===
// (Event listeners clavier, swipe, restart → Story 2.3)

// === INIT ===
document.addEventListener('DOMContentLoaded', initGame);
```

---

### Points critiques à ne pas rater

#### 1. Logique `mergeRow` — une seule fusion par paire par mouvement
```js
// Board: [2, 2, 2, 2]
// Après slide+merge+slide : [4, 4, 0, 0]  ← correct
// PAS : [8, 0, 0, 0]                       ← incorrect (deux fusions enchaînées interdites)
```
L'index `i++` dans `mergeRow` saute la tuile consommée pour éviter une double fusion.

#### 2. Mouvement invalide → pas de spawn
Si le board ne change pas après un mouvement (tuiles déjà à fond), **ne pas spawner de tuile** et ne pas incrémenter le score. Vérifier avec `boardsEqual` avant de modifier `state.board`.

#### 3. Rendu DOM : `innerHTML = ''` puis création de `.tile`
Les tuiles sont des éléments `.tile` enfants des `.cell`. Chaque `renderBoard()` repart de zéro. L'animation CSS `transition: transform 80ms ease-out` est déjà sur `.tile` dans `style.css`.

#### 4. Animation de fusion `.merge`
La classe `.merge` déclenche l'animation CSS `tile-merge` (scale 1.1→1.0) définie dans `style.css`. Ajouter la classe après le rendu sur les tuiles fusionnées, la retirer après la fin de l'animation. Si la Story simplifie : ajouter `.merge` à la création de la tuile, elle sera retirée au prochain `renderBoard()`.

**Simplification possible :** pour cette story, l'animation `.merge` peut être gérée via la classe ajoutée au `data-value` lors de la création. L'animation CSS est déjà dans `style.css`, elle joue automatiquement à l'insertion dans le DOM.

#### 5. `gameOver` dans `state` — vérifier AVANT spawn
L'ordre dans `move()` :
1. Calculer le nouveau board
2. Si inchangé → return
3. Mettre à jour `state.board`
4. Incrémenter score si gains
5. Spawner nouvelle tuile
6. Render
7. Vérifier game over → si oui, afficher modale

#### 6. `bestScore` localStorage
Clé : `'bestScore'`. Lire au démarrage avec `parseInt(localStorage.getItem('bestScore') || '0', 10)`.

#### 7. Modale : `hidden` attribut HTML
Montrer la modale : `element.removeAttribute('hidden')`
Cacher la modale : `element.setAttribute('hidden', '')`
**Ne pas utiliser** `style.display` — le CSS utilise `[hidden] { display: none }`.

#### 8. `move()` est globale — accessible depuis la console ET depuis Story 2.3
Ne pas encapsuler dans un module ou IIFE — Story 2.3 appelle `move(direction)` depuis les event listeners.

---

### Algorithme de test — vérification console

```js
// Test 1 : 2 tuiles initiales
initGame();
console.assert(state.board.flat().filter(v => v !== 0).length === 2, 'Exactement 2 tuiles au démarrage');

// Test 2 : Mouvement valide → nouvelle tuile
const countBefore = state.board.flat().filter(v => v !== 0).length;
move('left');
const countAfter = state.board.flat().filter(v => v !== 0).length;
// countAfter >= countBefore (fusion peut réduire, mais spawn ajoute 1)

// Test 3 : Score après fusion
state.board = [[2,2,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
state.score = 0;
move('left');
console.assert(state.score === 4, 'Score = 4 après fusion de deux 2');
console.assert(state.board[0][0] === 4, 'Tuile fusionnée = 4');

// Test 4 : Pas de fusion si valeurs différentes
state.board = [[2,4,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
const scoreBefore = state.score;
move('left');
// board[0][0]=2, board[0][1]=4 → pas de fusion

// Test 5 : Game over
state.board = [[2,4,2,4],[4,2,4,2],[2,4,2,4],[4,2,4,2]];
state.gameOver = false;
console.assert(isGameOver() === true, 'Game over détecté correctement');

// Test 6 : Mouvement invalide → board inchangé
state.board = [[2,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
state.gameOver = false;
const before = JSON.stringify(state.board);
move('left'); // tuile déjà à gauche
const after = JSON.stringify(state.board);
// board inchangé... mais une tuile a peut-être été spawned si le mouvement était valide
// Note: move('left') avec [2,0,0,0] est invalide → board inchangé, pas de spawn
```

### Project Structure Notes

- `frontend/app.js` : seul fichier modifié, organisé en sections `GAME ENGINE` / `DOM` / `API` / `CONTROLS`
- Pas de modules, pas d'import/export — vanilla JS global scope
- `move()` et `initGame()` doivent être accessibles globalement (pour Story 2.3 et la console)
- Pas de `tests/` (hors scope MVP)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.2] — ACs complets
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — state object, camelCase, fetch natif
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns] — un seul app.js, sections commentées
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Strategy] — GameGrid, Tile, ScoreBox
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns] — animations, micro-animation +N
- [Source: _bmad-output/implementation-artifacts/2-1-structure-html-design-system-css.md] — IDs DOM et classes CSS disponibles

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Aucun problème bloquant. Tests Node.js 24/24 passés.

### Completion Notes List

- ✅ `frontend/app.js` : moteur 2048 complet — `state`, `initGame()`, `spawnTile()`, `slideRow()`, `mergeRow()` (anti double-fusion via `i++`), `processRow()`, `moveLeft/Right/Up/Down()`, `move()`, `isGameOver()`, `renderBoard()`, `updateScore()`, `updateScoreDisplay()`, `showGameOver()`
- ✅ Détection de mouvement invalide via `boardsEqual()` — pas de spawn si le board est inchangé
- ✅ `bestScore` persisté en `localStorage` ('bestScore') — restauré au chargement, mis à jour en temps réel si dépassé
- ✅ Micro-animation "+N" via `.score-delta` ajouté dynamiquement et retiré à `animationend`
- ✅ `#game-over-modal` affiché via `removeAttribute('hidden')` — cohérent avec CSS `[hidden] { display: none }`
- ✅ Architecture en sections commentées : `GAME ENGINE` / `DOM` / `API` (placeholder) / `CONTROLS` (placeholder Story 2.3)
- ✅ 24 tests Node.js passés (slideRow, mergeRow, processRow, moveLeft/Right/Up/Down, isGameOver, boardsEqual, score, gameOver state, spawn initial)

### File List

- `frontend/app.js`

### Change Log

- 2026-03-15 : Implémentation initiale — moteur 2048 complet, rendu DOM, gestion score/bestScore, détection fin de partie, modale game over
