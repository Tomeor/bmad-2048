'use strict';
// Tests Story 5.1 — Correctif focus clavier automatique au chargement
// Exécuter avec : node test-story-5-1.js

const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${label}`);
    failed++;
  }
}

// ============================================================
// Lecture des fichiers sources
// ============================================================

const htmlContent = fs.readFileSync(path.join(__dirname, 'frontend/index.html'), 'utf8');
const cssContent  = fs.readFileSync(path.join(__dirname, 'frontend/style.css'), 'utf8');
const jsContent   = fs.readFileSync(path.join(__dirname, 'frontend/app.js'), 'utf8');

// ============================================================
// SUITE 1 — index.html : tabindex="-1" sur #game-grid
// ============================================================

console.log('\n--- Suite 1 : HTML — tabindex="-1" sur #game-grid ---');

assert(
  /id="game-grid"[^>]*tabindex="-1"/.test(htmlContent) ||
  /tabindex="-1"[^>]*id="game-grid"/.test(htmlContent),
  '#game-grid possède tabindex="-1"'
);

assert(
  /id="game-grid"[^>]*role="grid"/.test(htmlContent) ||
  /role="grid"[^>]*id="game-grid"/.test(htmlContent),
  '#game-grid conserve role="grid" (pas de régression)'
);

assert(
  /id="game-grid"[^>]*aria-label="Grille de jeu 2048"/.test(htmlContent) ||
  /aria-label="Grille de jeu 2048"[^>]*id="game-grid"/.test(htmlContent),
  '#game-grid conserve aria-label (pas de régression)'
);

// ============================================================
// SUITE 2 — style.css : règle focus programmatique masquée
// ============================================================

console.log('\n--- Suite 2 : CSS — outline masqué sur focus programmatique ---');

assert(
  cssContent.includes('#game-grid:focus:not(:focus-visible)'),
  'Règle #game-grid:focus:not(:focus-visible) présente'
);

assert(
  /#game-grid:focus:not\(:focus-visible\)\s*\{[^}]*outline:\s*none/.test(cssContent),
  'Règle contient outline: none'
);

assert(
  // La règle focus-visible universelle est toujours présente
  cssContent.includes('*:focus-visible'),
  'Règle *:focus-visible universelle préservée (pas de régression)'
);

// ============================================================
// SUITE 3 — app.js : focus dans la section INIT
// ============================================================

console.log('\n--- Suite 3 : JS — focus auto dans INIT ---');

// Extraire la section INIT
const initMatch = jsContent.match(/\/\/ === INIT ===([\s\S]*?)(?:\/\/ ===|$)/);
assert(initMatch !== null, 'Section // === INIT === trouvée dans app.js');

if (initMatch) {
  const initSection = initMatch[1];
  assert(
    initSection.includes("document.getElementById('game-grid').focus"),
    'Appel .focus() sur #game-grid présent dans INIT'
  );
  assert(
    initSection.includes('preventScroll: true'),
    'Option preventScroll: true utilisée dans INIT'
  );
  assert(
    initSection.includes('initGame()'),
    'initGame() toujours appelé dans INIT (pas de régression)'
  );
  assert(
    initSection.includes('loadLeaderboard()'),
    'loadLeaderboard() toujours appelé dans INIT (pas de régression)'
  );
}

// ============================================================
// SUITE 4 — app.js : retour de focus dans resetModal()
// ============================================================

console.log('\n--- Suite 4 : JS — retour de focus dans resetModal() ---');

// Extraire la fonction resetModal
const resetModalMatch = jsContent.match(/function resetModal\(\)\s*\{([\s\S]*?)\n\}/);
assert(resetModalMatch !== null, 'Fonction resetModal() trouvée dans app.js');

if (resetModalMatch) {
  const resetModalBody = resetModalMatch[1];
  assert(
    resetModalBody.includes("document.getElementById('game-grid').focus"),
    'Appel .focus() sur #game-grid présent dans resetModal()'
  );
  assert(
    resetModalBody.includes('preventScroll: true'),
    'Option preventScroll: true utilisée dans resetModal()'
  );
  // Vérifier que les lignes existantes sont préservées
  assert(
    resetModalBody.includes("pseudo-input"),
    'Reset pseudo-input préservé dans resetModal() (pas de régression)'
  );
  assert(
    resetModalBody.includes("modal-rank-display"),
    'Reset modal-rank-display préservé dans resetModal() (pas de régression)'
  );
  assert(
    resetModalBody.includes('leaderboard-section'),
    'Reset leaderboard-section préservé dans resetModal() (pas de régression)'
  );
}

// ============================================================
// SUITE 5 — app.js : MutationObserver focus trap modale préservé
// ============================================================

console.log('\n--- Suite 5 : JS — MutationObserver focus trap préservé ---');

assert(
  jsContent.includes('new MutationObserver'),
  'MutationObserver présent (focus trap modale non supprimé)'
);

assert(
  jsContent.includes("attributeFilter: ['hidden']"),
  'MutationObserver observe attribut hidden (comportement modale inchangé)'
);

assert(
  jsContent.includes('first.focus()'),
  'Focus sur premier élément focusable de la modale préservé'
);

// ============================================================
// SUITE 6 — app.js : listener keydown sur document préservé
// ============================================================

console.log('\n--- Suite 6 : JS — Listener keydown préservé ---');

assert(
  jsContent.includes("document.addEventListener('keydown'"),
  'Listener keydown sur document toujours présent (pas de régression contrôles)'
);

assert(
  jsContent.includes('ArrowLeft') && jsContent.includes('ArrowRight') &&
  jsContent.includes('ArrowUp') && jsContent.includes('ArrowDown'),
  'Toutes les touches directionnelles toujours gérées'
);

// ============================================================
// Résultat final
// ============================================================

console.log(`\n${'='.repeat(50)}`);
console.log(`Résultat : ${passed} tests passés, ${failed} tests échoués`);
if (failed > 0) {
  console.error('❌ Des tests ont échoué');
  process.exit(1);
} else {
  console.log('✅ Tous les tests passent');
}
