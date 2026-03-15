'use strict';
// Tests Story 5.2 — Correctif leaderboard non affiché sur desktop (cascade CSS)
// Exécuter avec : node test-story-5-2.js

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
// Lecture du fichier source
// ============================================================

const cssContent = fs.readFileSync(path.join(__dirname, 'frontend/style.css'), 'utf8');
const lines = cssContent.split('\n');

function lineOf(pattern) {
  for (let i = 0; i < lines.length; i++) {
    if (pattern.test ? pattern.test(lines[i]) : lines[i].includes(pattern)) {
      return i + 1; // 1-indexed
    }
  }
  return -1;
}

// ============================================================
// SUITE 1 — Présence des éléments clés
// ============================================================

console.log('\n--- Suite 1 : Présence des blocs CSS ---');

const leaderboardSectionLine = lineOf('.leaderboard-section {');
const mediaQueryLine = lineOf('@media (min-width: 768px)');
const leaderboardInMediaLine = lineOf('.leaderboard-section { flex: 4; display: block; }');
const leaderboardVisibleLine = lineOf('.leaderboard-section.visible {');

assert(leaderboardSectionLine > 0, 'Bloc .leaderboard-section { } présent dans style.css');
assert(mediaQueryLine > 0, 'Media query @media (min-width: 768px) présente');
assert(leaderboardInMediaLine > 0, '.leaderboard-section { flex: 4; display: block; } présente dans media query');
assert(leaderboardVisibleLine > 0, '.leaderboard-section.visible { display: block } présente');

// ============================================================
// SUITE 2 — Ordre correct des déclarations (cascade CSS)
// ============================================================

console.log('\n--- Suite 2 : Ordre de cascade CSS ---');

assert(
  leaderboardSectionLine > 0 && mediaQueryLine > 0 && leaderboardSectionLine < mediaQueryLine,
  `.leaderboard-section { display: none } (ligne ${leaderboardSectionLine}) déclaré AVANT le media query (ligne ${mediaQueryLine})`
);

assert(
  leaderboardInMediaLine > 0 && mediaQueryLine > 0 && leaderboardInMediaLine > mediaQueryLine,
  `display: block desktop (ligne ${leaderboardInMediaLine}) déclaré APRÈS le media query (ligne ${mediaQueryLine})`
);

// ============================================================
// SUITE 3 — Valeurs CSS correctes
// ============================================================

console.log('\n--- Suite 3 : Valeurs CSS ---');

assert(
  cssContent.includes('.leaderboard-section {') &&
  /\.leaderboard-section \{[^}]*display:\s*none/.test(cssContent),
  '.leaderboard-section contient display: none (mobile par défaut)'
);

assert(
  cssContent.includes('.leaderboard-section { flex: 4; display: block; }'),
  'Media query contient display: block pour .leaderboard-section'
);

assert(
  /\.leaderboard-section\.visible\s*\{[^}]*display:\s*block/.test(cssContent),
  '.leaderboard-section.visible contient display: block (mobile post-partie)'
);

// ============================================================
// SUITE 4 — Pas de doublon du bloc LEADERBOARD
// ============================================================

console.log('\n--- Suite 4 : Absence de doublon ---');

const leaderboardBlockCount = (cssContent.match(/\/\* === LEADERBOARD === \*\//g) || []).length;
assert(leaderboardBlockCount === 1, `Bloc /* === LEADERBOARD === */ présent exactement 1 fois (trouvé : ${leaderboardBlockCount})`);

// Vérifier que .leaderboard-section { display: none } n'est déclaré qu'une fois
// (en cherchant la ligne `.leaderboard-section {` suivie de display:none dans les 5 lignes suivantes)
let displayNoneInLeaderboardCount = 0;
for (let i = 0; i < lines.length; i++) {
  if (/^\.leaderboard-section \{/.test(lines[i])) {
    for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
      if (/display:\s*none/.test(lines[j])) { displayNoneInLeaderboardCount++; break; }
      if (lines[j].trim() === '}') break;
    }
  }
}
assert(displayNoneInLeaderboardCount === 1, `display: none dans .leaderboard-section {} déclaré exactement 1 fois (trouvé : ${displayNoneInLeaderboardCount})`);

// ============================================================
// SUITE 5 — Présence des styles leaderboard complets
// ============================================================

console.log('\n--- Suite 5 : Styles leaderboard complets ---');

assert(cssContent.includes('.leaderboard-row {'), '.leaderboard-row défini');
assert(cssContent.includes('.leaderboard-rank {'), '.leaderboard-rank défini');
assert(cssContent.includes('.leaderboard-pseudo {'), '.leaderboard-pseudo défini');
assert(cssContent.includes('.leaderboard-score {'), '.leaderboard-score défini');
assert(cssContent.includes('.leaderboard-date {'), '.leaderboard-date défini');
assert(cssContent.includes('.leaderboard-empty,'), '.leaderboard-empty défini');
assert(cssContent.includes('.skeleton-row {'), '.skeleton-row défini');
assert(cssContent.includes('@keyframes skeleton-shimmer'), 'Animation skeleton-shimmer définie');

// ============================================================
// SUITE 6 — Aucune modification du reste du CSS (pas de régression)
// ============================================================

console.log('\n--- Suite 6 : Intégrité du reste du CSS ---');

assert(cssContent.includes('*:focus-visible {'), 'Règle focus-visible universelle préservée');
assert(cssContent.includes('.layout {'), 'Classe .layout préservée');
assert(cssContent.includes('.game-section'), '.game-section préservée');
assert(!cssContent.includes('#game-grid:focus:not(:focus-visible)'), 'Règle outline #game-grid supprimée (focus sur body désormais)');
assert(cssContent.includes('.modal-overlay'), 'Styles modale préservés');
assert(cssContent.includes('.ai-badge {'), 'Badge AI préservé');

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
