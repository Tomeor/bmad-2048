# Story 3.2 : Modale fin de partie, soumission et affichage du rang

Status: done

## Story

En tant qu'agent de développement,
je veux implémenter la `GameOverModal` avec la soumission de score et l'affichage du rang,
afin que le joueur puisse enregistrer son score, découvrir sa position et rejouer sans friction.

## Acceptance Criteria

1. **Given** l'état `gameOver: true` déclenché par le moteur de jeu **When** la modale s'ouvre **Then** elle apparaît avec une animation `scale(0.95 → 1)` + `opacity(0 → 1)` en 150ms **And** elle affiche le score final de la partie **And** un champ texte avec placeholder `"Ton pseudo (optionnel)"` est présent **And** un bouton "Enregistrer mon score" (Primary) et un bouton "Rejouer" (Secondary) sont visibles **And** le focus est piégé dans la modale (focus trap actif)
2. **Given** la modale ouverte **When** le joueur clique sur "Enregistrer mon score" (avec ou sans pseudo) **Then** le bouton est désactivé et son texte change en "Enregistrement…" **And** `POST /scores` est appelé avec `{ pseudo, score }`
3. **Given** `POST /scores` appelé avec un champ pseudo vide **When** la requête est envoyée **Then** le pseudo est transmis comme `null` et le backend le stocke comme `"Anonyme"` (FR9)
4. **Given** `POST /scores` retourne `200` avec `{ id, rank }` **When** la réponse est reçue **Then** le rang du joueur est affiché dans la modale ("Tu es classé N° X !") **And** `GET /scores/top10` est rappelé et le leaderboard est mis à jour (FR14) **And** la nouvelle entrée du joueur est highlightée dans le leaderboard (classe `.highlight`) **And** sur mobile, le leaderboard devient visible (classe `.visible` sur `.leaderboard-section`)
5. **Given** `POST /scores` retourne une erreur (réseau, 429, 5xx) **When** l'erreur est reçue **Then** le bouton "Enregistrer" est réactivé **And** un message d'erreur inline s'affiche (`#modal-error` sans `hidden`) **And** un bouton "Réessayer" est affiché (`#retry-btn` sans `hidden`)
6. **Given** le message d'erreur et le bouton "Réessayer" affichés **When** le joueur clique sur "Réessayer" **Then** `POST /scores` est rappelé avec les mêmes données (pseudo lu depuis `#pseudo-input`, score depuis `state.score`)
7. **Given** la modale ouverte (succès ou erreur) **When** le joueur clique sur "Rejouer" **Then** la modale se ferme (handled by `initGame()`) **And** l'état de la modale est réinitialisé (bouton réactivé, pseudo vidé, rang masqué, erreur masquée) **And** sur mobile, le leaderboard est de nouveau masqué (classe `.visible` retirée)
8. **Given** la modale ouverte **When** le joueur appuie sur `Enter` avec le champ pseudo focalisé **Then** la soumission est déclenchée (équivalent au clic sur "Enregistrer")

## Tasks / Subtasks

- [x] Implémenter `submitScore()` dans la section `// === API ===` (AC: #2, #3, #4, #5)
  - [x] Lire `pseudo` depuis `#pseudo-input` : `.value.trim() || null`
  - [x] Lire `score` depuis `state.score`
  - [x] Désactiver `#submit-score-btn` + changer son texte en `"Enregistrement…"`
  - [x] Masquer `#modal-error` et `#retry-btn` (reset état erreur précédent)
  - [x] `fetch('/scores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pseudo, score }) })`
  - [x] Si `!res.ok` → throw pour déclencher le catch
  - [x] En cas de succès : afficher rang dans `#modal-rank-display`, rafraîchir leaderboard, highlight entrée, ajouter `.visible` à `.leaderboard-section`, changer texte bouton en `"Score enregistré ✓"` (bouton reste disabled)
  - [x] En cas d'erreur : réactiver bouton (texte initial), afficher `#modal-error`, afficher `#retry-btn`
- [x] Implémenter `highlightLeaderboardEntry(rank)` (AC: #4)
  - [x] Sélectionner toutes les `.leaderboard-row` dans `#leaderboard-list`
  - [x] Ajouter `.highlight` à `rows[rank - 1]` si l'élément existe
- [x] Implémenter `resetModal()` (AC: #7)
  - [x] Réactiver `#submit-score-btn`, texte `"Enregistrer mon score"`, `disabled = false`
  - [x] Vider `#pseudo-input`
  - [x] Masquer `#modal-rank-display` (ajouter `hidden`)
  - [x] Masquer `#modal-error` (ajouter `hidden`)
  - [x] Masquer `#retry-btn` (ajouter `hidden`)
  - [x] Retirer `.visible` de `.leaderboard-section`
- [x] Ajouter les event listeners (AC: #2, #6, #7, #8)
  - [x] `#submit-score-btn` click → `submitScore()`
  - [x] `#retry-btn` click → `submitScore()`
  - [x] `#pseudo-input` keydown `Enter` → `submitScore()`
  - [x] `#restart-btn` click → `resetModal()` (second listener, en plus de `initGame()` déjà câblé)
  - [x] `#modal-restart-btn` click → `resetModal()` (second listener)
- [x] Implémenter le focus trap pour la modale (AC: #1)
  - [x] `MutationObserver` sur `#game-over-modal` (attribut `hidden`) — au retrait de `hidden` : focus sur premier élément focusable
  - [x] Listener `keydown` sur `#game-over-modal` — Tab / Shift+Tab cyclique dans les éléments focusables non-masqués

## Dev Notes

### Contexte et contraintes critiques

**FICHIER UNIQUE À MODIFIER :** `frontend/app.js` — section `// === API ===` uniquement.

Remplacer le commentaire placeholder :
```js
// (submitScore → Story 3.2)
```
Par l'implémentation complète ci-dessous.

**NE PAS MODIFIER** les sections `GAME ENGINE`, `DOM`, `CONTROLS`, `INIT`.

**Pourquoi des listeners supplémentaires sur `#restart-btn` et `#modal-restart-btn` :**
- Ces boutons ont déjà un listener `click → initGame()` câblé dans la section `CONTROLS` (Story 2.3)
- On ajoute un second listener `click → resetModal()` — les deux s'exécutent dans l'ordre d'enregistrement
- `initGame()` masque déjà la modale via `setAttribute('hidden', '')` — `resetModal()` réinitialise l'état interne

---

### Implémentation complète

#### Remplacement de `// (submitScore → Story 3.2)` dans `// === API ===`

```js
// --- Score submission ---

async function submitScore() {
  const pseudo = document.getElementById('pseudo-input').value.trim() || null;
  const score = state.score;

  // Loading state
  const btn = document.getElementById('submit-score-btn');
  btn.disabled = true;
  btn.textContent = 'Enregistrement…';

  // Reset error state
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

    // Button stays disabled — score already submitted
    btn.textContent = 'Score enregistré ✓';

    // Refresh leaderboard and highlight new entry
    await loadLeaderboard();
    highlightLeaderboardEntry(rank);

    // Show leaderboard on mobile (FR13)
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
}

// Submission listeners
document.getElementById('submit-score-btn').addEventListener('click', submitScore);
document.getElementById('retry-btn').addEventListener('click', submitScore);
document.getElementById('pseudo-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') submitScore();
});

// Rejouer — réinitialise l'état modal + masque leaderboard mobile
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
```

---

### Points critiques à ne pas rater

#### 1. `pseudo` transmis comme `null` (pas chaîne vide) — FR9
Le backend normalise `null` → `"Anonyme"` dans `main.py:75` :
```python
pseudo = score_in.pseudo if score_in.pseudo and score_in.pseudo.strip() else "Anonyme"
```
Pydantic `ScoreIn` accepte `pseudo: Optional[str] = None`. Envoyer `null` en JSON → Python reçoit `None` → stockage `"Anonyme"`. **Ne pas envoyer une chaîne vide `""` — utiliser `|| null`.**

#### 2. `highlightLeaderboardEntry` appelée APRÈS `await loadLeaderboard()`
`loadLeaderboard()` est async et replace le `innerHTML` de `#leaderboard-list`. Il faut awaiter son retour AVANT de chercher `.leaderboard-row` dans le DOM. Ordre impératif :
```js
await loadLeaderboard();
highlightLeaderboardEntry(rank);
```

#### 3. `highlightLeaderboardEntry` — rang hors top 10 possible
Si `rank > 10`, `rows[rank - 1]` sera `undefined`. La condition `if (target)` protège silencieusement. **Ne pas throw — comportement attendu.**

#### 4. Double listener sur `#restart-btn` et `#modal-restart-btn`
Comportement garanti par la spec Web : les listeners s'exécutent dans leur ordre d'enregistrement. Story 2.3 enregistre `initGame()` en premier ; Story 3.2 enregistre `resetModal()` après. Séquence : `initGame()` (masque modale, reset plateau) → `resetModal()` (reset état interne modale). Les deux sont idempotents dans cet ordre.

#### 5. Focus trap — éléments focusables dynamiques
Le sélecteur `_focusable` filtre `[hidden]` et `[disabled]` pour ne piéger que les éléments réellement interactifs. Quand `#retry-btn` est `hidden`, il est exclu du cycle Tab. Quand `#submit-score-btn` est `disabled`, il est exclu aussi. Le focus trap s'adapte automatiquement aux états.

#### 6. MutationObserver sur attribut `hidden`
`initGame()` remet `#game-over-modal` à `setAttribute('hidden', '')`. Quand `showGameOver()` appelle `removeAttribute('hidden')`, le MutationObserver se déclenche → focus sur `#pseudo-input` (premier élément focusable). Cela satisfait l'AC #1 (focus trap actif à l'ouverture) sans modifier `showGameOver()` ni `initGame()`.

#### 7. Leaderboard mobile — `classList.add/remove('visible')`
CSS déjà en place (Story 2.1) :
```css
.leaderboard-section { display: none; }        /* mobile par défaut */
.leaderboard-section.visible { display: block; } /* ajouté par Story 3.2 */
```
`resetModal()` retire `.visible` → leaderboard masqué sur mobile lors du Rejouer.

#### 8. `POST /scores` — URL relative, pas d'URL absolue
Même règle que pour `GET /scores/top10` (Story 3.1). **Ne jamais écrire `http://localhost:8000/scores`.**

#### 9. Tester sans backend — mock fetch
```js
// Succès
global.fetch = async (url, opts) => ({
  ok: true,
  json: async () => ({ id: 1, rank: 3 }),
});

// Erreur réseau
global.fetch = async () => { throw new Error('Network error'); };

// Erreur 429
global.fetch = async () => ({ ok: false, status: 429 });
```

### Contrat API confirmé (backend/main.py:71-86)

```python
@app.post("/scores", response_model=RankResponse)
@limiter.limit("10/minute")
def submit_score(request: Request, score_in: ScoreIn, db: Session = Depends(get_db)):
    pseudo = score_in.pseudo if score_in.pseudo and score_in.pseudo.strip() else "Anonyme"
    new_score = Score(pseudo=pseudo, score=score_in.score)
    db.add(new_score)
    db.commit()
    db.refresh(new_score)
    rank = db.query(Score).filter(Score.score > score_in.score).count() + 1
    return RankResponse(id=new_score.id, rank=rank)
```

Request body (`ScoreIn`) :
```json
{ "pseudo": "Léa" | null, "score": 4096 }
```

Response (`RankResponse`) :
```json
{ "id": 42, "rank": 3 }
```

### HTML — IDs et attributs confirmés (frontend/index.html)

| Élément | ID / sélecteur | État initial |
|---|---|---|
| Modale overlay | `#game-over-modal` | `hidden` présent |
| Affichage rang | `#modal-rank-display` | `hidden` présent |
| Zone erreur | `#modal-error` | `hidden` présent |
| Texte erreur | `#modal-error-text` | (dans `#modal-error`) |
| Input pseudo | `#pseudo-input` | vide, `maxlength="20"` |
| Bouton enregistrer | `#submit-score-btn` | visible, enabled |
| Bouton réessayer | `#retry-btn` | `hidden` présent |
| Bouton rejouer modale | `#modal-restart-btn` | visible |
| Bouton rejouer jeu | `#restart-btn` | visible |
| Section leaderboard | `.leaderboard-section` | `display: none` (CSS) |

### CSS — classes déjà disponibles (frontend/style.css)

| Classe | Usage |
|---|---|
| `.modal-overlay[hidden]` | Cache la modale (CSS) |
| `.modal-rank[hidden]` | Cache l'affichage du rang |
| `.error-message[hidden]` | Cache le message d'erreur |
| `#retry-btn[hidden]` | Cache le bouton Réessayer |
| `.leaderboard-section.visible` | Affiche le leaderboard sur mobile |
| `.leaderboard-row.highlight` | Highlight de la nouvelle entrée (fond vert pâle + bordure `--color-success`) |

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.2] — ACs complets
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] — UX-DR5 (focus trap), UX-DR7 (erreur), UX-DR11 (animation modale), UX-DR12 (loading state)
- [Source: backend/main.py:71-86] — endpoint POST /scores, normalisation pseudo, calcul rank
- [Source: backend/schemas.py] — ScoreIn (pseudo Optional[str], score int > 0), RankResponse (id, rank)
- [Source: frontend/index.html] — tous les IDs de la modale confirmés
- [Source: frontend/style.css] — .leaderboard-section.visible, .leaderboard-row.highlight
- [Source: _bmad-output/implementation-artifacts/3-1-chargement-initial-du-leaderboard.md] — loadLeaderboard(), renderLeaderboard() déjà implémentés

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Aucun problème rencontré. 71 tests Node.js passés, 0 échoués.

### Completion Notes List

- ✅ `submitScore()` : fetch `POST /scores`, pseudo `null` si vide/espaces, loading state, affichage rang, `await loadLeaderboard()` puis highlight, leaderboard mobile `.visible`, erreur silencieuse avec message inline + retry
- ✅ `highlightLeaderboardEntry(rank)` : `.highlight` sur `rows[rank - 1]`, silencieux si rang hors top 10
- ✅ `resetModal()` : reset complet — bouton activé + texte restauré, pseudo vidé, rang/erreur/retry masqués, `.visible` retiré du leaderboard mobile
- ✅ Listeners : `#submit-score-btn` click, `#retry-btn` click, `#pseudo-input` Enter (keydown), double-listener `#restart-btn` / `#modal-restart-btn` → `resetModal()`
- ✅ Focus trap : MutationObserver sur attribut `hidden` de `#game-over-modal` → focus premier élément à l'ouverture ; Tab / Shift+Tab cyclique dans `input:not([disabled]), button:not([hidden]):not([disabled])`
- ✅ Sections GAME ENGINE, DOM, CONTROLS, INIT préservées sans modification
- ✅ 71 tests : normalisation pseudo (5), loading state (6), pseudo null (2), succès (8), erreur réseau (6), erreur 429 (3), erreur 5xx (2), reset erreur avant retry (2), highlightLeaderboardEntry (5), resetModal (11), focus trap Tab (8), focus trap filtrage (7), régressions escapeHtml (3), rank 1 (1), ordre loadLeaderboard→highlight (2)

### File List

- `frontend/app.js`
- `test-story-3-2.js`

### Change Log

- 2026-03-15 : Implémentation section `// === API ===` — `submitScore()`, `highlightLeaderboardEntry()`, `resetModal()` ; listeners soumission (`#submit-score-btn`, `#retry-btn`, `#pseudo-input` Enter) ; double-listeners Rejouer (`resetModal`) ; focus trap via MutationObserver + keydown Tab cyclique
