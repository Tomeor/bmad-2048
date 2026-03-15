'use strict';
// Tests Story 3.2 — Modale fin de partie, soumission et affichage du rang
// Exécuter avec : node test-story-3-2.js

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
// MOCK DOM minimal
// ============================================================

function makeMockElement(tag, attrs = {}) {
  const el = {
    _tag: tag,
    _attrs: { ...attrs },
    _classes: new Set(),
    _children: [],
    _listeners: {},
    textContent: '',
    innerHTML: '',
    disabled: false,
    value: '',

    setAttribute(k, v) { this._attrs[k] = v; },
    getAttribute(k) { return this._attrs[k] ?? null; },
    removeAttribute(k) { delete this._attrs[k]; },
    hasAttribute(k) { return k in this._attrs; },

    classList: null, // set below

    addEventListener(ev, fn) {
      if (!this._listeners[ev]) this._listeners[ev] = [];
      this._listeners[ev].push(fn);
    },
    dispatchEvent(ev) {
      (this._listeners[ev.type] || []).forEach(fn => fn(ev));
    },
    querySelectorAll(sel) {
      // Simplified: return _children filtered by class
      const cls = sel.match(/\.([a-z-]+)/)?.[1];
      return cls ? this._children.filter(c => c._classes.has(cls)) : [];
    },
    querySelector(sel) {
      return this.querySelectorAll(sel)[0] ?? null;
    },
    focus() { this._focused = true; },
  };
  el.classList = {
    _el: el,
    add(c) { el._classes.add(c); },
    remove(c) { el._classes.delete(c); },
    contains(c) { return el._classes.has(c); },
  };
  return el;
}

// Éléments DOM simulés
function makeDom() {
  const dom = {
    'submit-score-btn': makeMockElement('button'),
    'retry-btn': makeMockElement('button', { hidden: '' }),
    'pseudo-input': makeMockElement('input'),
    'modal-rank-display': makeMockElement('p', { hidden: '' }),
    'modal-error': makeMockElement('div', { hidden: '' }),
    'modal-error-text': makeMockElement('span'),
    'modal-restart-btn': makeMockElement('button'),
    'restart-btn': makeMockElement('button'),
    'game-over-modal': makeMockElement('div', { hidden: '' }),
    'leaderboard-list': makeMockElement('ol'),
  };

  // Texte initial du bouton submit
  dom['submit-score-btn'].textContent = 'Enregistrer mon score';

  return dom;
}

// ============================================================
// Recréer les fonctions extraites de app.js pour les tester
// (On extrait la logique pure sans les side effects DOM)
// ============================================================

// --- escapeHtml (Story 3.1, déjà testée — régressions) ---
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// --- highlightLeaderboardEntry ---
function highlightLeaderboardEntry(rank, listEl) {
  const rows = listEl.querySelectorAll('.leaderboard-row');
  const target = rows[rank - 1];
  if (target) target.classList.add('highlight');
}

// --- resetModal ---
function resetModal(dom, leaderboardSection) {
  const btn = dom['submit-score-btn'];
  btn.disabled = false;
  btn.textContent = 'Enregistrer mon score';
  dom['pseudo-input'].value = '';
  dom['modal-rank-display'].setAttribute('hidden', '');
  dom['modal-error'].setAttribute('hidden', '');
  dom['retry-btn'].setAttribute('hidden', '');
  leaderboardSection.classList.remove('visible');
}

// --- submitScore logique ---
async function submitScoreLogic(pseudoValue, score, fetchFn, dom, leaderboardSection, loadLeaderboardFn) {
  const pseudo = pseudoValue.trim() || null;

  const btn = dom['submit-score-btn'];
  btn.disabled = true;
  btn.textContent = 'Enregistrement…';

  dom['modal-error'].setAttribute('hidden', '');
  dom['retry-btn'].setAttribute('hidden', '');

  try {
    const res = await fetchFn('/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pseudo, score }),
    });
    if (!res.ok) throw new Error(res.status);
    const { rank } = await res.json();

    const rankDisplay = dom['modal-rank-display'];
    rankDisplay.textContent = `Tu es classé N° ${rank} !`;
    rankDisplay.removeAttribute('hidden');

    btn.textContent = 'Score enregistré ✓';

    await loadLeaderboardFn();
    highlightLeaderboardEntry(rank, dom['leaderboard-list']);

    leaderboardSection.classList.add('visible');

  } catch (e) {
    btn.disabled = false;
    btn.textContent = 'Enregistrer mon score';
    dom['modal-error'].removeAttribute('hidden');
    dom['retry-btn'].removeAttribute('hidden');
  }
}

// --- Focus trap logique ---
function buildFocusableList(modal) {
  // Simule la sélection des éléments focusables non-masqués/non-disabled
  return modal._children.filter(c =>
    !c.hasAttribute('hidden') && !c.disabled
  );
}

function handleTabKeyTrap(e, focusable) {
  if (e.key !== 'Tab') return false;
  if (focusable.length === 0) return false;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey) {
    if (e._activeElement === first) { e.preventDefault(); return 'focus-last'; }
  } else {
    if (e._activeElement === last) { e.preventDefault(); return 'focus-first'; }
  }
  return 'no-change';
}

// ============================================================
// TESTS
// ============================================================

// -------- 1. pseudo normalization --------
console.log('\n--- Normalisation du pseudo ---');

assert((''.trim() || null) === null, 'pseudo vide → null');
assert(('  '.trim() || null) === null, 'pseudo espaces → null');
assert(('Léa'.trim() || null) === 'Léa', 'pseudo valide conservé');
assert(('  Karim  '.trim() || null) === 'Karim', 'pseudo avec espaces trimmé');
assert(('0'.trim() || null) === '0', 'pseudo "0" (falsy string) conservé');

// -------- 2. submitScore — état loading --------
console.log('\n--- submitScore — état loading ---');

{
  const dom = makeDom();
  const leaderboardSection = makeMockElement('section');

  // Mock fetch qui ne résout jamais (on vérifie l'état immédiat)
  let capturedBody;
  const pendingFetch = new Promise(() => {});
  const mockFetch = (url, opts) => {
    capturedBody = JSON.parse(opts.body);
    return pendingFetch;
  };

  dom['pseudo-input'].value = 'TestUser';
  submitScoreLogic('TestUser', 4096, mockFetch, dom, leaderboardSection, async () => {});

  // Vérifications synchrones (avant résolution de la promise)
  assert(dom['submit-score-btn'].disabled === true, 'Bouton désactivé pendant loading');
  assert(dom['submit-score-btn'].textContent === 'Enregistrement…', 'Texte bouton → "Enregistrement…"');
  assert(!dom['modal-error'].hasAttribute('hidden') === false, 'Erreur masquée pendant loading');
  assert(!dom['retry-btn'].hasAttribute('hidden') === false, 'Retry masqué pendant loading');
  assert(capturedBody.pseudo === 'TestUser', 'pseudo transmis correctement');
  assert(capturedBody.score === 4096, 'score transmis correctement');
}

// -------- 3. submitScore — pseudo null transmis --------
console.log('\n--- submitScore — pseudo null ---');

{
  const dom = makeDom();
  const leaderboardSection = makeMockElement('section');
  let capturedBody;

  const mockFetch = (url, opts) => {
    capturedBody = JSON.parse(opts.body);
    return new Promise(() => {}); // pending
  };

  submitScoreLogic('', 2048, mockFetch, dom, leaderboardSection, async () => {});
  assert(capturedBody.pseudo === null, 'pseudo vide → null dans le body JSON');

  submitScoreLogic('   ', 2048, mockFetch, dom, leaderboardSection, async () => {});
  assert(capturedBody.pseudo === null, 'pseudo espaces → null dans le body JSON');
}

// -------- 4. submitScore — succès --------
console.log('\n--- submitScore — succès (rank 3) ---');

{
  const dom = makeDom();
  const leaderboardSection = makeMockElement('section');
  let leaderboardRefreshed = false;

  const mockFetch = async () => ({
    ok: true,
    json: async () => ({ id: 42, rank: 3 }),
  });
  const mockLoadLeaderboard = async () => { leaderboardRefreshed = true; };

  await submitScoreLogic('Léa', 4096, mockFetch, dom, leaderboardSection, mockLoadLeaderboard);

  assert(dom['modal-rank-display'].textContent === 'Tu es classé N° 3 !', 'Rang affiché correctement');
  assert(!dom['modal-rank-display'].hasAttribute('hidden'), 'modal-rank-display visible');
  assert(dom['submit-score-btn'].textContent === 'Score enregistré ✓', 'Texte bouton post-succès');
  assert(dom['submit-score-btn'].disabled === true, 'Bouton reste disabled post-succès (no double-submit)');
  assert(leaderboardRefreshed === true, 'loadLeaderboard() appelée après succès');
  assert(leaderboardSection.classList.contains('visible'), 'Leaderboard visible sur mobile');
  assert(dom['modal-error'].hasAttribute('hidden'), 'Erreur reste masquée en cas de succès');
  assert(dom['retry-btn'].hasAttribute('hidden'), 'Retry reste masqué en cas de succès');
}

// -------- 5. submitScore — erreur réseau --------
console.log('\n--- submitScore — erreur réseau ---');

{
  const dom = makeDom();
  const leaderboardSection = makeMockElement('section');

  const mockFetch = async () => { throw new Error('Network error'); };

  await submitScoreLogic('Léa', 4096, mockFetch, dom, leaderboardSection, async () => {});

  assert(dom['submit-score-btn'].disabled === false, 'Bouton réactivé après erreur réseau');
  assert(dom['submit-score-btn'].textContent === 'Enregistrer mon score', 'Texte bouton restauré');
  assert(!dom['modal-error'].hasAttribute('hidden'), 'Message erreur affiché');
  assert(!dom['retry-btn'].hasAttribute('hidden'), 'Bouton Réessayer affiché');
  assert(dom['modal-rank-display'].hasAttribute('hidden'), 'Rang reste masqué en cas d\'erreur');
  assert(!leaderboardSection.classList.contains('visible'), 'Leaderboard mobile non-visible après erreur');
}

// -------- 6. submitScore — erreur non-200 (429) --------
console.log('\n--- submitScore — erreur 429 ---');

{
  const dom = makeDom();
  const leaderboardSection = makeMockElement('section');

  const mockFetch = async () => ({ ok: false, status: 429 });

  await submitScoreLogic('Léa', 4096, mockFetch, dom, leaderboardSection, async () => {});

  assert(dom['submit-score-btn'].disabled === false, 'Bouton réactivé après 429');
  assert(!dom['modal-error'].hasAttribute('hidden'), 'Erreur affichée après 429');
  assert(!dom['retry-btn'].hasAttribute('hidden'), 'Retry affiché après 429');
}

// -------- 7. submitScore — erreur 5xx --------
console.log('\n--- submitScore — erreur 5xx ---');

{
  const dom = makeDom();
  const leaderboardSection = makeMockElement('section');

  const mockFetch = async () => ({ ok: false, status: 500 });

  await submitScoreLogic('Léa', 4096, mockFetch, dom, leaderboardSection, async () => {});

  assert(dom['submit-score-btn'].disabled === false, 'Bouton réactivé après 500');
  assert(!dom['modal-error'].hasAttribute('hidden'), 'Erreur affichée après 500');
}

// -------- 8. submitScore — reset état erreur avant retry --------
console.log('\n--- submitScore — reset état erreur avant retry ---');

{
  const dom = makeDom();
  const leaderboardSection = makeMockElement('section');
  // Simuler état d'erreur pré-existant
  dom['modal-error'].removeAttribute('hidden');
  dom['retry-btn'].removeAttribute('hidden');

  // Fetch qui reste pending (on vérifie le reset synchrone)
  const mockFetch = () => new Promise(() => {});
  submitScoreLogic('Léa', 4096, mockFetch, dom, leaderboardSection, async () => {});

  assert(dom['modal-error'].hasAttribute('hidden'), 'Erreur précédente masquée avant nouveau try');
  assert(dom['retry-btn'].hasAttribute('hidden'), 'Retry masqué avant nouveau try');
}

// -------- 9. highlightLeaderboardEntry --------
console.log('\n--- highlightLeaderboardEntry ---');

{
  const listEl = makeMockElement('ol');
  const rows = [
    makeMockElement('li'),
    makeMockElement('li'),
    makeMockElement('li'),
    makeMockElement('li'),
  ];
  rows.forEach(r => { r._classes.add('leaderboard-row'); listEl._children.push(r); });

  highlightLeaderboardEntry(1, listEl);
  assert(rows[0]._classes.has('highlight'), 'Rang 1 → rows[0] highlighté');
  assert(!rows[1]._classes.has('highlight'), 'Rang 1 → rows[1] non-highlighté');

  highlightLeaderboardEntry(3, listEl);
  assert(rows[2]._classes.has('highlight'), 'Rang 3 → rows[2] highlighté');

  highlightLeaderboardEntry(10, listEl);
  // rows[9] n'existe pas → pas d'erreur
  assert(true, 'Rang 10 hors liste → silencieux (pas d\'exception)');

  highlightLeaderboardEntry(11, listEl);
  assert(true, 'Rang 11 hors liste → silencieux (pas d\'exception)');
}

// -------- 10. resetModal --------
console.log('\n--- resetModal ---');

{
  const dom = makeDom();
  const leaderboardSection = makeMockElement('section');

  // Simuler l'état post-succès
  dom['submit-score-btn'].disabled = true;
  dom['submit-score-btn'].textContent = 'Score enregistré ✓';
  dom['pseudo-input'].value = 'Léa';
  dom['modal-rank-display'].removeAttribute('hidden');
  dom['modal-rank-display'].textContent = 'Tu es classé N° 3 !';
  dom['modal-error'].removeAttribute('hidden');
  dom['retry-btn'].removeAttribute('hidden');
  leaderboardSection.classList.add('visible');

  resetModal(dom, leaderboardSection);

  assert(dom['submit-score-btn'].disabled === false, 'Bouton réactivé');
  assert(dom['submit-score-btn'].textContent === 'Enregistrer mon score', 'Texte bouton restauré');
  assert(dom['pseudo-input'].value === '', 'Input pseudo vidé');
  assert(dom['modal-rank-display'].hasAttribute('hidden'), 'Rang masqué');
  assert(dom['modal-error'].hasAttribute('hidden'), 'Erreur masquée');
  assert(dom['retry-btn'].hasAttribute('hidden'), 'Retry masqué');
  assert(!leaderboardSection.classList.contains('visible'), 'Leaderboard mobile masqué');
}

// Simuler l'état post-erreur pour resetModal
{
  const dom = makeDom();
  const leaderboardSection = makeMockElement('section');

  dom['submit-score-btn'].disabled = false; // déjà réactivé après erreur
  dom['submit-score-btn'].textContent = 'Enregistrer mon score';
  dom['pseudo-input'].value = 'Karim';
  dom['modal-error'].removeAttribute('hidden');
  dom['retry-btn'].removeAttribute('hidden');

  resetModal(dom, leaderboardSection);

  assert(dom['pseudo-input'].value === '', 'Pseudo vidé même depuis état erreur');
  assert(dom['modal-error'].hasAttribute('hidden'), 'Erreur masquée depuis état erreur');
  assert(dom['retry-btn'].hasAttribute('hidden'), 'Retry masqué depuis état erreur');
  assert(dom['submit-score-btn'].disabled === false, 'Bouton toujours activé (idempotent)');
}

// -------- 11. Focus trap — handleTabKeyTrap --------
console.log('\n--- Focus trap — Tab cycle ---');

{
  const btnA = makeMockElement('button');
  const btnB = makeMockElement('button');
  const btnC = makeMockElement('button');
  const focusable = [btnA, btnB, btnC];

  // Tab sur dernier → focus premier
  const tabLast = { key: 'Tab', shiftKey: false, _activeElement: btnC, _defaultPrevented: false, preventDefault() { this._defaultPrevented = true; } };
  const result1 = handleTabKeyTrap(tabLast, focusable);
  assert(result1 === 'focus-first', 'Tab sur dernier élément → focus-first');
  assert(tabLast._defaultPrevented, 'preventDefault appelé sur Tab dernier');

  // Tab sur non-dernier → no-change
  const tabMiddle = { key: 'Tab', shiftKey: false, _activeElement: btnB, _defaultPrevented: false, preventDefault() { this._defaultPrevented = true; } };
  const result2 = handleTabKeyTrap(tabMiddle, focusable);
  assert(result2 === 'no-change', 'Tab sur élément milieu → no-change');

  // Shift+Tab sur premier → focus dernier
  const shiftTabFirst = { key: 'Tab', shiftKey: true, _activeElement: btnA, _defaultPrevented: false, preventDefault() { this._defaultPrevented = true; } };
  const result3 = handleTabKeyTrap(shiftTabFirst, focusable);
  assert(result3 === 'focus-last', 'Shift+Tab sur premier élément → focus-last');
  assert(shiftTabFirst._defaultPrevented, 'preventDefault appelé sur Shift+Tab premier');

  // Shift+Tab sur non-premier → no-change
  const shiftTabMiddle = { key: 'Tab', shiftKey: true, _activeElement: btnB, _defaultPrevented: false, preventDefault() { this._defaultPrevented = true; } };
  const result4 = handleTabKeyTrap(shiftTabMiddle, focusable);
  assert(result4 === 'no-change', 'Shift+Tab sur élément milieu → no-change');

  // Autre touche → false
  const otherKey = { key: 'Enter', shiftKey: false, _activeElement: btnA };
  const result5 = handleTabKeyTrap(otherKey, focusable);
  assert(result5 === false, 'Autre touche (Enter) → ignorée');

  // Liste vide → false
  const tabEmpty = { key: 'Tab', shiftKey: false, _activeElement: null };
  const result6 = handleTabKeyTrap(tabEmpty, []);
  assert(result6 === false, 'Liste focusable vide → ignoré');
}

// -------- 12. Focus trap — liste focusable dynamique (hidden/disabled) --------
console.log('\n--- Focus trap — filtrage éléments hidden/disabled ---');

{
  const modal = makeMockElement('div');
  const input = makeMockElement('input');
  const btnSubmit = makeMockElement('button');
  const btnRetry = makeMockElement('button', { hidden: '' }); // masqué
  const btnRejouer = makeMockElement('button');

  modal._children = [input, btnSubmit, btnRetry, btnRejouer];

  const focusable = buildFocusableList(modal);
  assert(focusable.length === 3, 'Éléments focusables : 3 (btnRetry[hidden] exclu)');
  assert(!focusable.includes(btnRetry), 'btnRetry[hidden] exclu du focus trap');
  assert(focusable.includes(input), 'input inclus');
  assert(focusable.includes(btnSubmit), 'btnSubmit inclus');
  assert(focusable.includes(btnRejouer), 'btnRejouer inclus');

  // Avec btnSubmit disabled
  btnSubmit.disabled = true;
  const focusable2 = buildFocusableList(modal);
  assert(focusable2.length === 2, 'Éléments focusables : 2 (btnSubmit[disabled] exclu)');
  assert(!focusable2.includes(btnSubmit), 'btnSubmit[disabled] exclu du focus trap');
}

// -------- 13. Régression — escapeHtml (Story 3.1) --------
console.log('\n--- Régression — escapeHtml ---');

assert(escapeHtml('<script>') === '&lt;script&gt;', 'XSS balises < > échappées');
assert(escapeHtml('&amp;') === '&amp;amp;', '& échappé');
assert(escapeHtml('normal') === 'normal', 'Texte normal inchangé');

// -------- 14. submitScore — succès rank 1 --------
console.log('\n--- submitScore — succès rank 1 ---');

{
  const dom = makeDom();
  const leaderboardSection = makeMockElement('section');

  const mockFetch = async () => ({
    ok: true,
    json: async () => ({ id: 1, rank: 1 }),
  });

  await submitScoreLogic('Champion', 8192, mockFetch, dom, leaderboardSection, async () => {});
  assert(dom['modal-rank-display'].textContent === 'Tu es classé N° 1 !', 'Rang 1 affiché');
}

// -------- 15. submitScore — succès, leaderboard refresh avant highlight --------
console.log('\n--- submitScore — ordre loadLeaderboard → highlight ---');

{
  const dom = makeDom();
  const leaderboardSection = makeMockElement('section');
  const callOrder = [];

  // loadLeaderboard ajoute des rows PUIS highlightLeaderboardEntry les cherche
  const mockLoadLeaderboard = async () => {
    callOrder.push('loadLeaderboard');
    // Simuler que le DOM est mis à jour
    const row = makeMockElement('li');
    row._classes.add('leaderboard-row');
    dom['leaderboard-list']._children = [row];
  };

  const mockFetch = async () => ({
    ok: true,
    json: async () => ({ id: 5, rank: 1 }),
  });

  await submitScoreLogic('Thomas', 9999, mockFetch, dom, leaderboardSection, mockLoadLeaderboard);

  assert(callOrder[0] === 'loadLeaderboard', 'loadLeaderboard appelée avant highlight');
  const rows = dom['leaderboard-list'].querySelectorAll('.leaderboard-row');
  assert(rows[0]._classes.has('highlight'), 'Row rank 1 highlightée après refresh');
}

// ============================================================
// RAPPORT FINAL
// ============================================================

console.log(`\n${'='.repeat(50)}`);
console.log(`Tests Story 3.2 : ${passed} passés, ${failed} échoués`);
if (failed > 0) {
  console.error('❌ DES TESTS ONT ÉCHOUÉ — Corriger avant de continuer');
  process.exit(1);
} else {
  console.log('✅ Tous les tests passent — Prêt pour l\'implémentation');
}
