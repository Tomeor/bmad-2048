# Story 4.2 : Sécurité production — CORS et validation end-to-end

Status: done

## Story

En tant qu'agent de développement,
je veux valider la configuration CORS avec la variable d'environnement `FRONTEND_ORIGIN` et produire une checklist de validation end-to-end,
afin que le backend n'accepte que les requêtes légitimes et que l'expérience joueur soit vérifiable de bout en bout.

## Acceptance Criteria

1. **Given** `main.py` avec le middleware CORS configuré **When** il est inspecté **Then** `allow_origins` est défini exclusivement depuis la variable d'environnement `FRONTEND_ORIGIN` (FR28) **And** aucune valeur d'origine n'est hardcodée dans le code
2. **Given** une requête `POST /scores` provenant de l'origine `FRONTEND_ORIGIN` en production **When** la requête arrive au backend **Then** la réponse inclut les headers CORS appropriés et la requête aboutit
3. **Given** une requête `POST /scores` provenant d'une origine non autorisée **When** la requête arrive au backend **Then** la réponse est bloquée par le middleware CORS (pas de headers CORS dans la réponse)
4. **Given** l'application déployée en production **When** une vérification end-to-end est effectuée **Then** la page se charge en moins de 2 secondes (NFR1) **And** une partie complète est jouable sur desktop (clavier) **And** une partie complète est jouable sur mobile (swipe) **And** la soumission d'un score de test fonctionne et retourne un rang **And** le leaderboard se met à jour après la soumission **And** les headers HTTP confirment HTTPS actif sur toutes les réponses
5. **Given** les variables d'environnement sur Render.com **When** elles sont inspectées dans le dashboard **Then** `DATABASE_URL` et `FRONTEND_ORIGIN` sont définies sans être exposées dans le code source (FR29)

## Tasks / Subtasks

- [x] Vérifier et tester statiquement la configuration CORS de `main.py` (AC: #1)
  - [x] Confirmer que `FRONTEND_ORIGIN` est lu depuis `os.getenv("FRONTEND_ORIGIN", ...)` — pas hardcodé
  - [x] Confirmer que `allow_origins=[FRONTEND_ORIGIN]` — pas de liste avec URL en dur
  - [x] Confirmer qu'aucune chaîne `https://` hardcodée n'apparaît dans la configuration CORS
  - [x] Aucune modification requise — code conforme depuis Story 1.3
- [x] Vérifier la configuration CORS complète du middleware (AC: #1, #2, #3)
  - [x] `allow_credentials=True` présent
  - [x] `allow_methods=["*"]` présent
  - [x] `allow_headers=["*"]` présent
  - [x] Middleware CORS ajouté AVANT SlowAPIMiddleware dans `main.py`
- [x] Produire la checklist end-to-end pour Thomas dans le Dev Agent Record (AC: #2, #3, #4, #5)
  - [x] Checklist manuelle : vérification CORS depuis navigateur
  - [x] Checklist manuelle : test jeu complet desktop + mobile
  - [x] Checklist manuelle : soumission score + vérification leaderboard
  - [x] Checklist manuelle : inspection headers HTTPS

## Dev Notes

### Contexte et contraintes critiques

**FICHIER À VÉRIFIER :** `backend/main.py` — configuration CORS (lignes 20, 30-36).

**Code CORS attendu — déjà implémenté en Story 1.3 :**
```python
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:8080")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Aucune modification du code source n'est attendue.** Cette story est une story de vérification et de validation. Si le code est conforme (ce qui est le cas d'après l'inspection en Story 4.1), les tâches consistent à :
1. Valider statiquement le code (`main.py`)
2. Écrire des tests d'inspection statique
3. Produire la checklist end-to-end pour Thomas

---

### Pourquoi CORS sur un mono-service ?

En production Render, FastAPI sert frontend + API sur la même URL (`https://test-bmad.onrender.com`). En théorie, il n'y a pas de problème CORS (même origine). Mais le middleware CORS est utile pour :
- **Développement local** : éviter les erreurs CORS quand le frontend tourne sur `localhost:8080` et l'API sur `localhost:8000`
- **Défense en profondeur** : bloquer des appels cross-origin non autorisés depuis d'autres domaines
- **Conformité FR28** : spécification explicite dans le PRD

Le middleware est configuré correctement — la valeur par défaut `"http://localhost:8080"` fonctionne en dev, et `FRONTEND_ORIGIN` de Render remplace en prod.

---

### Checklist end-to-end pour Thomas (post-déploiement)

Après avoir complété Story 4.1 (déploiement Render), effectuer ces vérifications manuelles :

#### ✅ CORS — Vérification navigateur (AC: #2, #3)

Depuis la console DevTools (`F12 → Network`) sur `https://test-bmad.onrender.com` :

```
1. Charger la page → onglet Network → requête GET /scores/top10
   → Headers réponse : Access-Control-Allow-Origin: https://test-bmad.onrender.com ✓

2. Soumettre un score → requête POST /scores
   → Headers réponse : Access-Control-Allow-Origin présent ✓
   → Statut 200 avec { id, rank } ✓
```

Depuis un autre domaine (ex. ouvrir `frontend/index.html` localement sans backend) :
```
3. fetch('https://test-bmad.onrender.com/scores/top10') depuis un autre domaine
   → CORS bloqué si l'origine n'est pas FRONTEND_ORIGIN ✓
```

#### ✅ HTTPS — Vérification headers (AC: #4)

```bash
curl -I https://test-bmad.onrender.com
# Attendu : HTTP/2 200, Strict-Transport-Security présent (Render injecte automatiquement)
```

Ou dans DevTools → Security → "Connection is secure" ✓

#### ✅ Fonctionnalités jeu (AC: #4)

**Desktop :**
- [ ] Page chargée → leaderboard visible avec skeleton puis données
- [ ] Partie jouable avec les touches ArrowLeft/Right/Up/Down
- [ ] Score mis à jour en temps réel
- [ ] Fin de partie → modale ouverte avec focus sur l'input
- [ ] Soumission score avec pseudo → rang affiché
- [ ] Leaderboard mis à jour après soumission
- [ ] Rejouer → nouvelle partie, modale fermée

**Mobile :**
- [ ] Grille plein écran
- [ ] Leaderboard masqué pendant la partie
- [ ] Swipe gauche/droite/haut/bas fonctionnel
- [ ] Fin de partie → modale ouverte
- [ ] Soumission score → leaderboard visible sur mobile
- [ ] Rejouer → leaderboard masqué à nouveau

#### ✅ Variables d'environnement Render (AC: #5)

Dans le dashboard Render.com → Service `test-bmad` → Environment :
- [ ] `DATABASE_URL` : valeur automatique (via fromDatabase, non visible)
- [ ] `FRONTEND_ORIGIN` : `https://test-bmad.onrender.com`
- [ ] Aucune de ces valeurs n'est dans le code source ni dans `render.yaml` en clair

---

### Tests statiques à implémenter (inspection de `main.py`)

Tests Node.js via lecture du fichier `backend/main.py` :

```js
// Test 1 : FRONTEND_ORIGIN depuis os.getenv
assert(mainPy.includes('os.getenv("FRONTEND_ORIGIN"'), 'FRONTEND_ORIGIN depuis os.getenv');
assert(!mainPy.match(/allow_origins=\["https?:\/\//), 'Pas d\'URL hardcodée dans allow_origins');
assert(mainPy.includes('allow_origins=[FRONTEND_ORIGIN]'), 'allow_origins = variable env');
assert(mainPy.includes('allow_credentials=True'), 'allow_credentials=True');
assert(mainPy.includes('allow_methods=["*"]'), 'allow_methods=["*"]');
assert(mainPy.includes('allow_headers=["*"]'), 'allow_headers=["*"]');
```

---

### Configuration CORS confirmée (backend/main.py:20-36)

État actuel du code — **correct, aucune modification requise** :

```python
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:8080")  # ligne 20

app.add_middleware(                                                         # ligne 30
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],   # variable env, jamais hardcodé
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### Learnings from Story 4.1 (previous)

- Story 4.1 : render.yaml écrit, main.py et requirements.txt vérifiés sans modification
- Confirmation : le code backend était déjà prêt pour la prod depuis Story 1.3
- Cette story suit le même pattern : vérification statique + documentation

### Project Structure Notes

- Aucun fichier à créer ou modifier (si code conforme)
- Si une non-conformité est détectée → modifier `backend/main.py` uniquement
- Cette story clôt l'Epic 4 et le projet complet

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.2] — ACs complets
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security] — CORS config
- [Source: backend/main.py:20-36] — configuration CORS actuelle
- [Source: render.yaml] — FRONTEND_ORIGIN défini comme variable Render

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Aucun problème rencontré. 24 tests Node.js passés, 0 échoués. Aucune modification du code source requise — tout était conforme depuis Story 1.3.

### Completion Notes List

- ✅ CORS vérifié : `FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:8080")` — aucune valeur hardcodée
- ✅ `allow_origins=[FRONTEND_ORIGIN]` — variable d'environnement utilisée exclusivement
- ✅ `allow_credentials=True`, `allow_methods=["*"]`, `allow_headers=["*"]` configurés
- ✅ Ordre middleware correct : `CORSMiddleware` avant `SlowAPIMiddleware`
- ✅ Secrets vérifiés : aucune URL PostgreSQL dans `main.py` ni `render.yaml` ; `fromDatabase` pour DATABASE_URL
- ✅ `load_dotenv()` appelé au démarrage pour le dev local
- ✅ Checklist end-to-end produite dans Dev Notes : CORS DevTools, HTTPS curl, jeu desktop/mobile, soumission score, variables Render
- ✅ 24 tests : CORS env var (5), middleware params (4), ordre middleware (3), valeur défaut dev (1), secrets env (7), chargement config (3), régression routes/StaticFiles (1)
- ℹ️ ACs #2, #3, #4, #5 nécessitent une validation manuelle post-déploiement par Thomas — checklist fournie dans Dev Notes

### File List

- `test-story-4-2.js`

### Change Log

- 2026-03-15 : Vérification statique complète CORS `main.py` — configuration conforme, 0 modification du code source ; checklist end-to-end produite pour validation manuelle post-déploiement
