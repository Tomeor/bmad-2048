# Story 2.3 : Contrôles clavier, swipe et bouton Rejouer

Status: review

## Story

En tant qu'agent de développement,
je veux implémenter les contrôles clavier (desktop), swipe tactile (mobile) et le bouton Rejouer,
afin que le joueur puisse interagir avec le jeu sur toutes les plateformes cibles.

## Acceptance Criteria

1. **Given** un utilisateur sur desktop **When** il appuie sur une touche directionnelle (ArrowUp, ArrowDown, ArrowLeft, ArrowRight) **Then** le déplacement correspondant est déclenché dans le moteur de jeu (FR2) **And** la réponse est perceptible en < 100ms
2. **Given** un utilisateur sur mobile **When** il effectue un swipe (touchstart → touchend avec delta X ou Y > 30px) **Then** la direction du swipe est correctement détectée (haut/bas/gauche/droite) (FR3) **And** le déplacement correspondant est déclenché dans le moteur de jeu
3. **Given** un swipe diagonal ou un micro-tap (delta < 30px dans toutes les directions) **When** le geste est détecté **Then** aucun déplacement n'est déclenché
4. **Given** une partie en cours ou terminée **When** le joueur clique sur le bouton "Rejouer" (`#restart-btn` ou `#modal-restart-btn`) **Then** la grille est réinitialisée à 2 tuiles aléatoires (FR6) **And** le score courant est remis à `0` **And** `gameOver` est remis à `false` **And** le meilleur score en localStorage est conservé **And** la modale fin de partie est masquée (attribut `hidden` remis)
5. **Given** un état `gameOver: true` **When** le joueur appuie sur une touche directionnelle ou swipe **Then** aucun déplacement n'est déclenché (le jeu est gelé jusqu'au "Rejouer")

## Tasks / Subtasks

- [x] Implémenter les contrôles clavier (AC: #1, #5)
  - [x] Ajouter un listener `keydown` sur `document` pour ArrowLeft, ArrowRight, ArrowUp, ArrowDown
  - [x] Appeler `e.preventDefault()` sur ces touches uniquement (empêche le scroll de la page)
  - [x] Déléguer à `move(direction)` — qui gère déjà `state.gameOver` en Story 2.2
- [x] Implémenter les contrôles swipe tactile (AC: #2, #3, #5)
  - [x] Listener `touchstart` sur `document` — stocker `clientX` et `clientY` dans des variables locales
  - [x] Listener `touchend` sur `document` — calculer `deltaX = endX - startX`, `deltaY = endY - startY`
  - [x] Si `Math.max(|deltaX|, |deltaY|) < 30` → ne rien faire (micro-tap ou geste trop court)
  - [x] Sinon, prendre l'axe dominant : `|deltaX| > |deltaY|` → gauche/droite, sinon → haut/bas
  - [x] Utiliser `{ passive: true }` sur les deux listeners (performance, ne pas bloquer le scroll natif)
  - [x] Déléguer à `move(direction)` — qui gère déjà `state.gameOver`
- [x] Implémenter les boutons Rejouer (AC: #4)
  - [x] `#restart-btn` (toujours visible dans la section jeu) → listener `click` → appelle `initGame()`
  - [x] `#modal-restart-btn` (dans `#game-over-modal`) → listener `click` → appelle `initGame()`
  - [x] `initGame()` masque déjà `#game-over-modal` via `setAttribute('hidden', '')` — pas besoin de code supplémentaire

## Dev Notes

### Contexte et contraintes critiques

**FICHIER UNIQUE À MODIFIER :** `frontend/app.js` — section `// === CONTROLS ===` uniquement.

La section CONTROLS est déjà présente comme placeholder en fin de fichier :
```js
// === CONTROLS ===
// (event listeners clavier, swipe, restart → Story 2.3)
```

**NE PAS MODIFIER** les sections `GAME ENGINE`, `DOM`, `API`. Les fonctions `move()` et `initGame()` sont déjà implémentées (Story 2.2) — ne pas les redéfinir, les appeler directement.

**Pas de nouveau DOMContentLoaded requis** : le script est chargé avec `<script defer src="app.js">`. Avec `defer`, le script s'exécute APRÈS que le DOM est entièrement parsé → `document.getElementById(...)` est utilisable directement dans la section CONTROLS sans wrapper `DOMContentLoaded`.

---

### Implémentation complète de la section CONTROLS

```js
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
```

---

### Points critiques à ne pas rater

#### 1. `move()` gère déjà `state.gameOver`
La vérification `if (state.gameOver) return` est dans `move()` (Story 2.2). Les event listeners clavier et swipe délèguent directement à `move()` — **aucun check `gameOver` supplémentaire n'est nécessaire dans les listeners**.

#### 2. `{ passive: true }` obligatoire sur touch events
Sans `passive: true`, le navigateur doit attendre que le handler JS se termine avant de savoir si `preventDefault()` sera appelé, ce qui bloque le scroll. On ne veut pas appeler `preventDefault()` sur les touch events (ça bloquerait le scroll natif et poserait des problèmes d'accessibilité). `{ passive: true }` permet au navigateur d'optimiser le scroll.

#### 3. `e.preventDefault()` uniquement sur keydown (pas sur touch)
Sur `keydown`, `e.preventDefault()` est nécessaire pour empêcher que les touches flèches scrollent la page. Sans ça, appuyer sur ArrowDown déplace les tuiles ET scrolle la page vers le bas.

#### 4. `initGame()` masque déjà la modale
Dans Story 2.2, `initGame()` contient :
```js
document.getElementById('game-over-modal').setAttribute('hidden', '');
```
Donc cliquer sur "Rejouer" dans la modale via `#modal-restart-btn` → `initGame()` → la modale se ferme automatiquement. **Ne pas dupliquer cette logique dans le listener.**

#### 5. IDs des boutons dans le HTML (Story 2.1)
- `<button class="btn btn-secondary" id="restart-btn">Rejouer</button>` — dans `.game-section` (toujours visible)
- `<button class="btn btn-secondary" id="modal-restart-btn">Rejouer</button>` — dans `.modal-card` (visible seulement quand modale ouverte)

Ces deux boutons appellent tous les deux `initGame()`.

#### 6. Swipe — axe dominant et seuil
- Seuil : **30px** (spécifié dans les ACs)
- Si `|deltaX| > |deltaY|` : direction horizontale (left ou right selon le signe de `dx`)
- Sinon : direction verticale (up ou down selon le signe de `dy`)
- Cas diagonal où `|deltaX| == |deltaY|` : la condition `>` (strictement supérieur) donne la priorité au vertical — comportement acceptable

### Project Structure Notes

- Seul fichier modifié : `frontend/app.js`
- La section CONTROLS remplace le commentaire placeholder actuel
- Pas de nouveau fichier, pas de module, pas de dépendance — vanilla JS global scope
- `move()` et `initGame()` restent dans le scope global (pas d'IIFE, pas de module) — accessibles directement

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3] — ACs complets
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive Design & Accessibility] — touchstart/touchend, delta X/Y
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns] — un seul app.js, sections commentées
- [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines] — règle 2 : jamais de nouveau fichier JS
- [Source: _bmad-output/implementation-artifacts/2-1-structure-html-design-system-css.md] — IDs `#restart-btn`, `#modal-restart-btn`
- [Source: _bmad-output/implementation-artifacts/2-2-moteur-de-jeu-2048-logique-et-rendu.md] — `move()`, `initGame()` disponibles

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Aucun problème rencontré. 46 tests Node.js passés, 0 échoués.

### Completion Notes List

- ✅ Listener `keydown` sur `document` : ArrowLeft/Right/Up/Down → `move()`, `e.preventDefault()` sur flèches uniquement
- ✅ Listener `touchstart` sur `document` : capture `clientX`/`clientY` avec `{ passive: true }`
- ✅ Listener `touchend` sur `document` : calcul delta, seuil 30px, axe dominant, `{ passive: true }`
- ✅ `#restart-btn` et `#modal-restart-btn` → `initGame()` (masque modale automatiquement)
- ✅ `move()` délégué directement — `state.gameOver` déjà géré dans la fonction (Story 2.2)
- ✅ Sections `GAME ENGINE`, `DOM`, `API`, `INIT` préservées sans modification
- ✅ 46 tests : mapping clavier (8), détection swipe (19 cas), gameOver (3), structure app.js (16)

### File List

- `frontend/app.js`

### Change Log

- 2026-03-15 : Implémentation de la section `// === CONTROLS ===` — listeners clavier (keydown), swipe (touchstart/touchend), boutons Rejouer (#restart-btn, #modal-restart-btn)
