---
stepsCompleted: ["step-01-init", "step-02-context", "step-03-starter", "step-04-decisions", "step-05-patterns", "step-06-structure", "step-07-validation", "step-08-complete"]
workflowType: 'architecture'
lastStep: 8
status: 'complete'
completedAt: '2026-03-14'
inputDocuments: ["prd.md", "ux-design-specification.md", "product-brief-test-bmad-2026-03-14.md"]
workflowType: 'architecture'
project_name: 'test-bmad'
user_name: 'Thomas'
date: '2026-03-14'
---

# Architecture Decision Document

_Ce document se construit collaborativement étape par étape. Les sections sont ajoutées au fil des décisions architecturales._

---

## Project Context Analysis

### Requirements Overview

**Functional Requirements (30 FRs) :**

| Catégorie | FRs | Implications architecturales |
|---|---|---|
| Moteur de jeu | FR1–FR6 | Logique pure JS côté client, état en mémoire |
| Soumission de score | FR7–FR11 | API call async, gestion d'erreur réseau, retry |
| Leaderboard | FR12–FR15 | Fetch initial au chargement + refresh post-soumission |
| API Backend | FR16–FR21 | 2 endpoints REST, validation, rate limiting, persistance |
| Interface & Design | FR22–FR26 | CSS custom, responsive, 1 breakpoint |
| Déploiement & Sécurité | FR27–FR30 | HTTPS, CORS, env vars, CI/CD Git-based |

**Non-Functional Requirements :**
- Chargement initial < 2s
- Actions jeu < 100ms (traitement local, pas de réseau)
- API < 1s en conditions normales
- Rate limiting : 10 req/IP/minute → réponse `429`
- CORS restreint à l'origine frontend (variable d'environnement)
- Aucune donnée sensible collectée (pas d'auth, pas d'email)

**Implications de la spec UX :**
- Animations CSS (pas JS) — impact positif sur les performances
- Un seul breakpoint `768px` — architecture CSS simple, mobile-first
- Leaderboard masqué sur mobile pendant la partie — état conditionnel simple
- Focus trap sur modale — gestion de focus JS nécessaire
- `aria-live` sur le score — mises à jour DOM accessibles

**Scale & Complexity :**

- Complexité : **Faible** — projet greenfield, développeur solo, périmètre fixe
- Domaine primaire : Web full-stack (SPA vanilla + API REST Python)
- Composants architecturaux : 4 (frontend statique, API backend, base de données, infrastructure)

### Technical Constraints & Dependencies

- **Stack imposée :** HTML/CSS/JS vanilla (pas de framework, pas de build step) + Python FastAPI
- **Hébergement :** Render.com (tier gratuit) — filesystem éphémère sur le web service
- **Base de données :** PostgreSQL Render free tier (prod) / SQLite (dev local) via `DATABASE_URL` env var
  - Décision motivée : SQLite sur Render free tier = données perdues à chaque redéploiement (filesystem éphémère)
  - SQLAlchemy comme ORM : compatible SQLite + PostgreSQL sans modifier le code métier
- **Déploiement :** Git push → build automatique Render.com
- **Secrets :** Gérés exclusivement via variables d'environnement

### Cross-Cutting Concerns Identified

- **Sécurité** — CORS, validation et sanitisation des entrées, rate limiting (tous côté backend)
- **Gestion d'erreur** — réseau instable, backend indisponible → toujours deux sorties (Réessayer + Rejouer)
- **Persistance** — choix PostgreSQL Render pour garantir la survie aux redémarrages
- **Performance** — chargement < 2s sans build step : minimiser les dépendances réseau au chargement initial

---

## Starter Template Evaluation

### Primary Technology Domain

Web full-stack — SPA statique (HTML/CSS/JS vanilla) + API REST (Python FastAPI). Stack entièrement définie en amont : pas de starter CLI applicable.

### Starter Options Considered

Pas de starter template classique (`create-react-app`, `vite`, etc.) applicable à une stack vanilla sans build step. Structure de projet définie manuellement.

### Selected Starter: Structure manuelle vanilla + FastAPI

**Rationale for Selection :**
Stack imposée par le PRD (vanilla JS, pas de framework, pas de build step). La structure manuelle offre un contrôle total, zéro dépendances à démêler, et s'aligne avec l'objectif pédagogique du projet.

**Initialization Command :**

```bash
mkdir -p test-bmad/frontend test-bmad/backend
touch test-bmad/frontend/index.html test-bmad/frontend/style.css test-bmad/frontend/app.js
touch test-bmad/backend/main.py test-bmad/backend/models.py test-bmad/backend/database.py
touch test-bmad/backend/schemas.py test-bmad/backend/requirements.txt test-bmad/backend/.env.example
touch test-bmad/render.yaml test-bmad/README.md
```

**Project Structure :**

```
test-bmad/
├── frontend/
│   ├── index.html          # SPA unique, point d'entrée
│   ├── style.css           # Tokens CSS + layout + composants
│   └── app.js              # Logique jeu + fetch API + DOM
├── backend/
│   ├── main.py             # App FastAPI, routes, CORS
│   ├── models.py           # SQLAlchemy — modèle Score
│   ├── database.py         # Connexion DB (SQLite dev / PostgreSQL prod)
│   ├── schemas.py          # Pydantic — validation entrées/sorties
│   ├── requirements.txt    # Dépendances Python
│   └── .env.example        # Template variables d'environnement
├── render.yaml             # Configuration déploiement Render.com
└── README.md
```

**Architectural Decisions Provided by Starter :**

**Language & Runtime :**
- Frontend : JavaScript vanilla ES6+ (modules natifs du navigateur)
- Backend : Python 3.11+, FastAPI + Uvicorn

**Styling Solution :**
- CSS custom vanilla avec variables CSS (`:root`) comme design tokens — pas de preprocesseur

**Build Tooling :**
- Aucun build step — fichiers servis statiquement tels quels

**Dependencies (requirements.txt) :**
```
fastapi
uvicorn[standard]
sqlalchemy
psycopg2-binary
python-dotenv
slowapi
```

**Environment Variables :**
```
DATABASE_URL=postgresql://...   # Render prod (SQLite en local)
FRONTEND_ORIGIN=https://...     # CORS whitelist
```

**Code Organization :**
- Séparation frontend/backend en dossiers distincts, déployables séparément
- ORM SQLAlchemy : compatible SQLite (dev) + PostgreSQL (prod) sans modifier le code métier
- Validation Pydantic intégrée à FastAPI
- Rate limiting via SlowAPI (middleware FastAPI)
- Configuration exclusivement par variables d'environnement

**Note :** La création de cette structure de fichiers sera la première story d'implémentation.

---

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation) :**
- Modèle de données `scores` + stratégie de migration
- Design des endpoints API (contrat frontend ↔ backend)
- Stratégie de déploiement (mono-service vs deux services)

**Important Decisions (Shape Architecture) :**
- Gestion d'état frontend (objet JS pur + localStorage)
- Retour du rang dans `POST /scores` (évite un second appel)

**Deferred Decisions (Post-MVP) :**
- Pagination du leaderboard (Top 10 uniquement pour le MVP)
- Monitoring / alerting (hors scope projet d'apprentissage)

### Data Architecture

**Modèle Score :**
```sql
scores (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  pseudo      VARCHAR(20) DEFAULT 'Anonyme',
  score       INTEGER NOT NULL CHECK (score > 0),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

- Pas de déduplication par pseudo — chaque soumission = nouvelle entrée (confirmé PRD)
- Pas d'Alembic — `CREATE TABLE IF NOT EXISTS` au démarrage de l'app (suffisant pour cette complexité)
- SQLAlchemy ORM : même code pour SQLite (dev) et PostgreSQL (prod)

**Validation Pydantic :**
```python
class ScoreIn(BaseModel):
    pseudo: Optional[str] = Field(None, max_length=20)
    score: int = Field(..., gt=0)

class ScoreOut(BaseModel):
    pseudo: str
    score: int
    created_at: datetime
```

### Authentication & Security

- **Auth :** Aucune — API publique (confirmé PRD)
- **CORS :** `allow_origins=[FRONTEND_ORIGIN]` depuis variable d'environnement
- **Rate limiting :** SlowAPI — 10 req/IP/minute sur `POST /scores` → `429` si dépassé
- **Validation :** Pydantic sur toutes les entrées avant insertion DB
- **Secrets :** Variables d'environnement uniquement (`DATABASE_URL`, `FRONTEND_ORIGIN`)

### API & Communication Patterns

**Endpoints :**
```
POST /scores
  Body:  { "pseudo": "string?" (max 20 chars), "score": int (> 0) }
  200:   { "id": int, "rank": int }
  422:   { "detail": "..." }      # validation Pydantic
  429:   { "detail": "Rate limit exceeded" }

GET /scores/top10
  200:   [{ "pseudo": "string", "score": int, "created_at": "ISO datetime" }]
```

- Le `rank` est retourné dans `POST /scores` : évite un deuxième appel GET après soumission
- Format datetime ISO 8601 pour compatibilité JS native (`new Date(...)`)
- Documentation automatique FastAPI disponible sur `/docs`

### Frontend Architecture

**State management (objet JS pur) :**
```js
const state = {
  board: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]],
  score: 0,
  bestScore: 0,     // persisté en localStorage
  gameOver: false
}
```

- `bestScore` persisté via `localStorage` — survit aux rechargements sans backend
- Pas de framework, pas de réactivité automatique — mises à jour DOM manuelles après chaque action
- Fetch API natif pour les appels backend (pas d'Axios ni autre lib)

### Infrastructure & Deployment

**Stratégie : mono-service FastAPI**

FastAPI sert à la fois l'API et les fichiers statiques frontend via `StaticFiles` :
```python
app.mount("/", StaticFiles(directory="frontend", html=True), name="static")
```

- Une seule URL en production → pas de problème CORS
- Un seul service Render à configurer et maintenir
- En développement local : backend sur `localhost:8000`, frontend ouvert directement dans le navigateur (ou via un simple serveur HTTP)

**render.yaml :**
```yaml
services:
  - type: web
    name: test-bmad
    env: python
    buildCommand: pip install -r backend/requirements.txt
    startCommand: uvicorn backend.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: test-bmad-db
          property: connectionString
      - key: FRONTEND_ORIGIN
        value: https://test-bmad.onrender.com

databases:
  - name: test-bmad-db
    plan: free
```

### Decision Impact Analysis

**Implementation Sequence :**
1. Structure de fichiers + `requirements.txt`
2. Backend : `database.py` (connexion + création table) + `models.py` + `schemas.py`
3. Backend : `main.py` (FastAPI app + CORS + rate limiting + endpoints)
4. Frontend : moteur de jeu (`app.js`) + rendu (`index.html` + `style.css`)
5. Frontend : intégration API (fetch scores, POST score, affichage rang)
6. Déploiement : `render.yaml` + variables d'environnement Render

**Cross-Component Dependencies :**
- Le frontend dépend du contrat API (endpoints, format JSON) — à figer avant l'implémentation frontend
- La DB doit être provisionnée sur Render avant le premier déploiement backend
- `FRONTEND_ORIGIN` doit être connu avant de configurer CORS (URL Render générée au premier déploiement)

---

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**6 zones de conflit potentiel identifiées et adressées :** naming, formats API, structure fichiers, gestion d'erreur, états de chargement, validation.

### Naming Patterns

**Database Naming Conventions :**

| Zone | Convention | Exemple |
|---|---|---|
| Tables | `snake_case` pluriel | `scores` |
| Colonnes | `snake_case` | `created_at`, `pseudo` |

**API Naming Conventions :**

| Zone | Convention | Exemple |
|---|---|---|
| Endpoints | `snake_case` pluriel | `/scores`, `/scores/top10` |
| Champs JSON | `snake_case` | `{ "pseudo": "...", "score": 123 }` |

**Code Naming Conventions :**

| Zone | Convention | Exemple |
|---|---|---|
| Fonctions Python | `snake_case` | `get_top_scores()` |
| Variables JS | `camelCase` | `gameState`, `bestScore` |
| Fonctions JS | `camelCase` | `renderBoard()`, `submitScore()` |
| Classes CSS | `kebab-case` | `.game-grid`, `.score-box` |
| Variables CSS | `--kebab-case` | `--color-tile-2`, `--color-bg` |

### Structure Patterns

**Project Organization :**
- Pas de dossier `tests/` (hors scope MVP)
- Utilitaires JS dans `app.js`, organisés par sections commentées : `// === GAME ENGINE ===`, `// === API ===`, `// === DOM ===`
- CSS dans `style.css`, organisé par sections : `/* === TOKENS === */`, `/* === LAYOUT === */`, `/* === TILES === */`, `/* === MODAL === */`

**File Structure Rules :**
- Un seul fichier JS (`app.js`) — pas de modules supplémentaires
- Un seul fichier CSS (`style.css`) — pas de fichiers CSS additionnels

### Format Patterns

**API Response Formats — format direct (pas de wrapper) :**

```json
// GET /scores/top10
[{ "pseudo": "Léa", "score": 4096, "created_at": "2026-03-14T12:00:00Z" }]

// POST /scores
{ "id": 42, "rank": 3 }

// 422 Validation error (Pydantic standard)
{ "detail": [{ "loc": ["body", "score"], "msg": "...", "type": "..." }] }

// 429 Rate limit
{ "detail": "Rate limit exceeded. Try again later." }
```

**Data Exchange Formats :**
- Dates : ISO 8601 UTC (`"2026-03-14T12:00:00Z"`) — compatible `new Date(str)` JS natif
- Booléens : `true`/`false` natif JSON
- Pseudo absent ou vide → stocké comme `"Anonyme"` (normalisé côté backend)

### Communication Patterns

**State Management Patterns :**
```js
const state = {
  board: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]],
  score: 0,
  bestScore: 0,    // persisté localStorage
  gameOver: false
}
// Mises à jour : mutation directe de state + appel renderBoard()
// Pas d'immutabilité requise (pas de framework réactif)
```

### Process Patterns

**Error Handling Pattern (toujours deux sorties) :**
```js
async function submitScore(pseudo, score) {
  try {
    setSubmitLoading(true)
    const res = await fetch('/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pseudo: pseudo || null, score })
    })
    if (!res.ok) throw new Error(res.status)
    const data = await res.json()
    showRank(data.rank)
  } catch (e) {
    showSubmitError('Oups, impossible d\'enregistrer ton score.')
  } finally {
    setSubmitLoading(false)
  }
}
```

**Loading State Pattern :**
- Désactiver le bouton + changer son texte (`"Enregistrement…"`) — pas de spinner overlay

**Validation Pattern :**
- Pydantic uniquement côté backend — pas de validation manuelle redondante dans les routes FastAPI

### Enforcement Guidelines

**All AI Agents MUST :**
1. Ne jamais utiliser `camelCase` pour les colonnes DB ou champs JSON API
2. Ne jamais créer de fichier JS supplémentaire — tout dans `app.js`
3. Ne jamais créer de fichier CSS supplémentaire — tout dans `style.css`
4. Toujours utiliser `fetch` natif — pas d'Axios ni autre lib HTTP
5. Toujours retourner les erreurs avec le format Pydantic standard — pas de format custom
6. Les variables d'environnement sont la seule source de config — pas de valeurs hardcodées en prod

---

## Project Structure & Boundaries

### Complete Project Directory Structure

```
test-bmad/
├── .gitignore
├── README.md
├── render.yaml                         # Config déploiement Render.com
│
├── frontend/
│   ├── index.html                      # SPA unique — point d'entrée
│   ├── style.css                       # Tokens CSS + layout + composants
│   └── app.js                          # Moteur jeu + fetch API + DOM
│
└── backend/
    ├── main.py                         # FastAPI app + CORS + rate limiting + routes + StaticFiles
    ├── models.py                       # SQLAlchemy — modèle Score
    ├── database.py                     # Moteur DB + session + create_tables()
    ├── schemas.py                      # Pydantic — ScoreIn, ScoreOut, RankResponse
    ├── requirements.txt                # Dépendances Python
    └── .env.example                    # Template variables d'environnement
```

### Architectural Boundaries

**API Boundaries :**
```
frontend/app.js  ──fetch──►  backend/main.py
                              POST /scores
                              GET  /scores/top10
```

**Data Boundaries :**
```
main.py (routes)  ──SQLAlchemy──►  database.py (session)  ──►  scores table
schemas.py valide les entrées avant toute interaction DB
```

**Serving Boundary :**
```
Render.com  ──►  uvicorn  ──►  main.py
                                ├── /scores     (API JSON)
                                └── /*          (StaticFiles → frontend/)
```

### Requirements to Structure Mapping

**Feature Mapping :**

| FRs | Fichier(s) |
|---|---|
| FR1–FR6 (moteur jeu) | `frontend/app.js` — section `GAME ENGINE` |
| FR7–FR11 (soumission score) | `frontend/app.js` — section `API` + `main.py` route `POST /scores` |
| FR12–FR15 (leaderboard) | `frontend/app.js` — section `DOM` + `main.py` route `GET /scores/top10` |
| FR16–FR21 (API backend) | `main.py` + `schemas.py` + `models.py` + `database.py` |
| FR22–FR26 (interface design) | `frontend/style.css` + `frontend/index.html` |
| FR27–FR30 (déploiement/sécurité) | `render.yaml` + `main.py` (CORS) + `.env.example` |

### Integration Points

**Data Flow :**
```
Joueur (swipe/touche)
  ▼
app.js — gameLoop() → state → renderBoard()
  ▼ (fin de partie)
app.js — submitScore() → fetch POST /scores
  ▼
main.py — Pydantic validation → SlowAPI rate limit → SQLAlchemy insert → return { id, rank }
  ▼
app.js — showRank(rank) → fetch GET /scores/top10 → renderLeaderboard()
```

### Development Workflow Integration

**Développement local :**
- Backend : `uvicorn backend.main:app --reload` (port 8000)
- Frontend : ouvrir `frontend/index.html` directement ou via `python -m http.server` (port 8080)
- DB locale : SQLite via `DATABASE_URL=sqlite:///./scores.db` dans `.env`

**Déploiement Render :**
- Push Git → build automatique → service web unique (FastAPI sert frontend + API)
- PostgreSQL provisionné séparément via `render.yaml`

---

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility :**
- FastAPI + SQLAlchemy + Pydantic + SlowAPI — stack cohérente et éprouvée, sans conflits
- SQLAlchemy compatible SQLite (dev) et PostgreSQL (prod) sans modification du code métier
- Mono-service Render simplifie CORS (même origine frontend/backend)

**Pattern Consistency :**
- `snake_case` JSON cohérent avec les conventions Python
- `camelCase` JS cohérent avec les conventions frontend vanilla
- Tous les patterns de nommage sont mutuellement exclusifs (aucune ambiguïté)

**Structure Alignment :**
- Structure de fichiers minimale alignée sur la stack vanilla (aucun dossier inutile)
- Boundaries API/Data/Serving clairement séparées

### Requirements Coverage Validation ✅

| Catégorie | FRs | Couverture architecturale |
|---|---|---|
| Moteur de jeu | FR1–FR6 | `app.js` section GAME ENGINE |
| Soumission score | FR7–FR11 | `app.js` + `POST /scores` + gestion erreur |
| Leaderboard | FR12–FR15 | `app.js` + `GET /scores/top10` |
| API backend | FR16–FR21 | `main.py` + `schemas.py` + SlowAPI |
| Interface design | FR22–FR26 | `style.css` + `index.html` |
| Déploiement/sécurité | FR27–FR30 | `render.yaml` + CORS + env vars |

**NFR Coverage :**
- Chargement < 2s : pas de build step, aucun bundle lourd ✅
- Actions jeu < 100ms : traitement local, aucun appel réseau ✅
- API < 1s : FastAPI + PostgreSQL sur même infrastructure ✅
- Rate limiting : SlowAPI 10 req/IP/min ✅
- HTTPS : SSL automatique Render.com ✅

### Implementation Readiness Validation ✅

- Toutes les décisions critiques documentées avec rationale
- Patterns de nommage complets avec exemples
- Structure de fichiers spécifique (pas de placeholders génériques)
- Contrat API figé (format JSON, codes HTTP, gestion erreurs)

### Gap Analysis Results

- **Critique :** Aucune lacune bloquante
- **Nice-to-have :** `README.md` avec instructions setup + `.gitignore` → traités en première story

### Architecture Completeness Checklist

- [x] Contexte projet analysé et validé
- [x] Complexité évaluée (faible, greenfield)
- [x] Contraintes techniques identifiées
- [x] Structure de projet complète définie
- [x] Décisions architecturales documentées avec rationale
- [x] Stack technique spécifiée (FastAPI, SQLAlchemy, Pydantic, SlowAPI)
- [x] Patterns d'implémentation définis (naming, format, erreurs)
- [x] Frontières et intégrations cartographiées
- [x] Flux de données documenté
- [x] Stratégie de déploiement définie (render.yaml, mono-service)

### Architecture Readiness Assessment

**Overall Status : READY FOR IMPLEMENTATION**

**Confidence Level : Élevé**

**Key Strengths :**
- Stack minimaliste, zéro dépendance superflue
- Périmètre fixe et bien défini — aucune ambiguïté
- Décisions de déploiement résolues (PostgreSQL Render, mono-service)
- Patterns suffisamment précis pour guider des agents IA sans conflits

### Implementation Handoff

**Ordre d'implémentation recommandé :**
1. Structure de fichiers + `.gitignore` + `requirements.txt` + `.env.example`
2. `database.py` + `models.py` + `schemas.py` (couche données)
3. `main.py` (FastAPI app, CORS, rate limiting, endpoints, StaticFiles)
4. `frontend/index.html` + `frontend/style.css` (structure HTML + design tokens)
5. `frontend/app.js` (moteur jeu + DOM + API)
6. `render.yaml` + provisioning PostgreSQL + déploiement Render.com
