# Story 3.1 : Chargement initial du leaderboard

Status: done

## Story

En tant qu'agent de développement,
je veux implémenter le chargement et l'affichage du leaderboard Top 10 au démarrage,
afin que le joueur desktop voie immédiatement le classement à son arrivée sur la page.

## Acceptance Criteria

1. **Given** la page chargée sur un viewport desktop (≥ 768px) **When** `GET /scores/top10` est en cours de chargement **Then** le leaderboard affiche 3 barres skeleton animées (placeholder de chargement)
2. **Given** la réponse de `GET /scores/top10` est reçue avec des entrées **When** le leaderboard est rendu **Then** jusqu'à 10 entrées sont affichées, triées par score décroissant (FR12) **And** chaque ligne affiche : le rang (médaille 🥇🥈🥉 pour le top 3), le pseudo, le score et la date formatée (FR15)
3. **Given** la réponse de `GET /scores/top10` est reçue vide (aucun score en base) **When** le leaderboard est rendu **Then** un message "Sois le premier !" est affiché à la place de la liste
4. **Given** `GET /scores/top10` retourne une erreur réseau ou un statut non-200 **When** l'erreur est reçue **Then** un message discret "Classement indisponible" est affiché **And** le jeu reste entièrement jouable (l'erreur leaderboard ne bloque pas la partie)
5. **Given** la page chargée sur un viewport mobile (< 768px) **When** la page s'affiche **Then** le leaderboard est masqué pendant la partie **And** `GET /scores/top10` est tout de même appelé en arrière-plan pour préparer les données

## Tasks / Subtasks

- [x] Implémenter `loadLeaderboard()` dans la section `// === API ===` (AC: #1, #3, #4, #5)
  - [x] Appel `fetch('/scores/top10')` — URL relative, pas de base URL codée en dur
  - [x] Si `!res.ok` → throw pour déclencher le catch
  - [x] En cas de succès → appeler `renderLeaderboard(entries)`
  - [x] En cas d'erreur (réseau ou non-200) → appeler `renderLeaderboardError()`
- [x] Implémenter `renderLeaderboard(entries)` (AC: #2, #3)
  - [x] Si `entries.length === 0` → afficher `<li class="leaderboard-empty">Sois le premier !</li>`
  - [x] Sinon → générer les `<li class="leaderboard-row">` avec rang, pseudo, score, date
  - [x] Rang : médaille `🥇🥈🥉` pour index 0/1/2, numéro `${i + 1}` ensuite
  - [x] Date : `new Date(entry.created_at).toLocaleDateString('fr-FR')`
  - [x] Échapper le pseudo avec `escapeHtml()` pour prévenir les injections XSS
- [x] Implémenter `renderLeaderboardError()` (AC: #4)
  - [x] Remplacer `#leaderboard-list` innerHTML par `<li class="leaderboard-error">Classement indisponible</li>`
- [x] Implémenter `escapeHtml(str)` — helper XSS (AC: #2)
  - [x] Remplacer `&`, `<`, `>` par leurs entités HTML
- [x] Modifier la section `// === INIT ===` pour appeler `loadLeaderboard()` au démarrage (AC: #1, #5)
  - [x] Transformer `document.addEventListener('DOMContentLoaded', initGame)` en callback qui appelle `initGame()` ET `loadLeaderboard()`
  - [x] `loadLeaderboard()` est appelée UNE SEULE FOIS au démarrage — PAS dans `initGame()` (qui est aussi appelé par Rejouer)

## Dev Notes

### Contexte et contraintes critiques

**FICHIERS À MODIFIER :** `frontend/app.js` — deux sections uniquement :
1. `// === API ===` — remplacer le placeholder commentaire par les 4 fonctions
2. `// === INIT ===` — modifier le listener `DOMContentLoaded`

**NE PAS MODIFIER** les sections `GAME ENGINE`, `DOM`, `CONTROLS`.

**Pourquoi `loadLeaderboard()` N'EST PAS dans `initGame()` :**
- `initGame()` est appelé au démarrage ET à chaque clic sur "Rejouer"
- On ne veut pas recharger le leaderboard à chaque restart — seulement au démarrage et après soumission de score (Story 3.2)
- Le leaderboard initial est chargé une seule fois via `DOMContentLoaded`

---

### Implémentation complète

#### Section `// === API ===`

```js
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

// (submitScore → Story 3.2)
```

#### Section `// === INIT ===`

```js
// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
  initGame();
  loadLeaderboard();
});
```

---

### Points critiques à ne pas rater

#### 1. URL relative `/scores/top10` — jamais d'URL absolue
En production, FastAPI sert à la fois le frontend et l'API (mono-service Render). L'URL relative fonctionne dans les deux contextes :
- Dev local : FastAPI sur `localhost:8000` sert aussi les fichiers statiques, donc `/scores/top10` est résolu
- Production Render : même domaine, même URL
- **NE PAS écrire** `http://localhost:8000/scores/top10` ou autre URL hardcodée

#### 2. Le skeleton est déjà dans le HTML — ne pas le recréer
`index.html` contient déjà dans `#leaderboard-list` :
```html
<li class="skeleton-row"></li>
<li class="skeleton-row"></li>
<li class="skeleton-row"></li>
```
Ces éléments sont visibles pendant le chargement. Quand `renderLeaderboard()` ou `renderLeaderboardError()` est appelée, elle remplace le `innerHTML` — les skeletons disparaissent automatiquement. **Ne pas ajouter de skeleton via JS.**

#### 3. Visibilité mobile — gérée par CSS, pas par JS
`.leaderboard-section { display: none }` par défaut en mobile, `display: block` à 768px — c'est déjà dans `style.css`. Story 3.1 **ne touche pas** à la visibilité de `.leaderboard-section`. L'AC #5 (leaderboard masqué sur mobile) est satisfait par le CSS existant.

#### 4. XSS — `escapeHtml()` obligatoire sur `entry.pseudo`
Le pseudo vient d'une entrée utilisateur stockée en DB. Même si le backend valide (max 20 chars), il ne sanitise pas les caractères HTML. Un pseudo `<script>alert(1)</script>` serait stocké tel quel. **Toujours `escapeHtml(entry.pseudo)` avant insertion dans le DOM.**

#### 5. Format de date — `toLocaleDateString('fr-FR')`
`entry.created_at` est une string ISO 8601 UTC (`"2026-03-15T12:00:00"`). `new Date(str)` la parse nativement. `toLocaleDateString('fr-FR')` produit `"15/03/2026"`. Simple et lisible.

#### 6. `loadLeaderboard()` est `async` — erreurs silencieuses
Si le fetch échoue (backend indisponible, erreur réseau), le `catch` affiche "Classement indisponible" mais **ne propage pas l'erreur**. Le jeu reste 100% jouable. Ne jamais propager cette erreur vers le haut.

#### 7. Tester sans backend
Pour tester `loadLeaderboard()` sans backend, on peut mocker `fetch` en Node.js :
```js
global.fetch = async (url) => ({
  ok: true,
  json: async () => [
    { pseudo: 'Léa', score: 4096, created_at: '2026-03-15T10:00:00' },
    { pseudo: 'Karim', score: 2048, created_at: '2026-03-15T09:00:00' },
  ]
});
```

### Contrat API confirmé (backend/main.py:89)

```python
@app.get("/scores/top10", response_model=List[ScoreOut])
def get_top10(db: Session = Depends(get_db)):
    return db.query(Score).order_by(Score.score.desc()).limit(10).all()
```

`ScoreOut` schema :
```python
class ScoreOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    pseudo: str
    score: int
    created_at: datetime  # → serialisé en ISO 8601 par FastAPI
```

Réponse JSON type :
```json
[
  { "pseudo": "Léa", "score": 4096, "created_at": "2026-03-15T10:00:00" },
  { "pseudo": "Karim", "score": 2048, "created_at": "2026-03-15T09:00:00" }
]
```

### CSS déjà disponible (style.css — Story 2.1)

| Classe | Usage |
|---|---|
| `.leaderboard-row` | Conteneur d'une ligne du classement |
| `.leaderboard-rank` | Rang ou médaille |
| `.leaderboard-pseudo` | Pseudo du joueur |
| `.leaderboard-score` | Score |
| `.leaderboard-date` | Date formatée |
| `.leaderboard-empty` | Message "vide" |
| `.leaderboard-error` | Message erreur |
| `.skeleton-row` | Barre skeleton (déjà dans HTML) |

### Learnings from Story 2.3 (previous)

- Script `defer` → DOM disponible immédiatement → `getElementById` utilisable sans extra `DOMContentLoaded`
- Mais `loadLeaderboard()` est `async` → l'appeler dans `DOMContentLoaded` est correct pour garantir que tout est prêt
- Ne pas créer de nouvelle fonction dans `initGame()` — risk de régression sur le moteur de jeu

### Project Structure Notes

- Fichiers modifiés : `frontend/app.js` uniquement
- Pas de nouveau fichier, pas de dépendance externe — `fetch` natif
- `loadLeaderboard()` exposée globalement (accessible depuis Story 3.2 pour le refresh post-soumission)
- `renderLeaderboard()` exposée globalement (Story 3.2 l'appellera avec les données rafraîchies)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.1] — ACs complets
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] — format réponse, fetch natif
- [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines] — règle 4 : fetch natif uniquement
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Additional Patterns] — skeleton, états vide/erreur
- [Source: backend/main.py:89] — endpoint GET /scores/top10 confirmé
- [Source: backend/schemas.py] — ScoreOut : pseudo, score, created_at
- [Source: frontend/index.html] — #leaderboard-list, .skeleton-row, .leaderboard-section
- [Source: frontend/style.css] — classes leaderboard déjà définies

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Aucun problème rencontré. 50 tests Node.js passés, 0 échoués.

### Completion Notes List

- ✅ `escapeHtml()` : protection XSS sur `&`, `<`, `>`
- ✅ `loadLeaderboard()` : fetch `/scores/top10`, async, erreur silencieuse (réseau ou non-200)
- ✅ `renderLeaderboard(entries)` : liste vide → "Sois le premier !", médailles 🥇🥈🥉 top 3, date `fr-FR`, XSS sur pseudo
- ✅ `renderLeaderboardError()` : "Classement indisponible" avec classe `.leaderboard-error`
- ✅ `// === INIT ===` : DOMContentLoaded → `initGame()` + `loadLeaderboard()` (séparés, leaderboard non rechargé sur Rejouer)
- ✅ Sections GAME ENGINE, DOM, CONTROLS préservées sans modification
- ✅ 50 tests : escapeHtml (6), médailles (5), dates (2), renderLeaderboard (15 cas), loadLeaderboard async (4), structure app.js (18)

### File List

- `frontend/app.js`

### Change Log

- 2026-03-15 : Implémentation section `// === API ===` — `escapeHtml()`, `loadLeaderboard()`, `renderLeaderboard()`, `renderLeaderboardError()` ; mise à jour `// === INIT ===` pour appel dual `initGame()` + `loadLeaderboard()`
