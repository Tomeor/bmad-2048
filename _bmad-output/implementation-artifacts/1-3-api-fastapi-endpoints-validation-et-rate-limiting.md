# Story 1.3 : API FastAPI — endpoints, validation et rate limiting

Status: review

## Story

En tant qu'agent de développement,
je veux implémenter l'application FastAPI avec ses deux endpoints, la validation Pydantic et le rate limiting SlowAPI,
afin que l'API soit fonctionnelle et testable via `/docs`.

## Acceptance Criteria

1. **Given** l'API en cours d'exécution (`uvicorn backend.main:app --reload`) **When** `POST /scores` est appelé avec `{"pseudo": "Léa", "score": 4096}` **Then** la réponse est `200` avec `{"id": <int>, "rank": <int>}` et le score est persisté en base de données
2. **Given** l'API en cours d'exécution **When** `POST /scores` est appelé avec `{"score": 4096}` (pseudo absent) **Then** la réponse est `200` et le pseudo est stocké comme `"Anonyme"`
3. **Given** l'API en cours d'exécution **When** `POST /scores` est appelé avec `{"score": -1}` ou `{"score": 0}` **Then** la réponse est `422` avec un message d'erreur Pydantic standard
4. **Given** l'API en cours d'exécution **When** `POST /scores` est appelé avec `{"pseudo": "UnPseudoTropLong21chars", "score": 100}` **Then** la réponse est `422` (pseudo dépasse 20 caractères)
5. **Given** la même IP effectue 11 appels `POST /scores` en moins d'une minute **When** le 11e appel arrive **Then** la réponse est `429` avec `{"detail": "Rate limit exceeded. Try again later."}`
6. **Given** l'API en cours d'exécution **When** `GET /scores/top10` est appelé **Then** la réponse est `200` avec un tableau JSON d'au plus 10 entrées, triées par score décroissant, chaque entrée contenant `pseudo` (string), `score` (int), `created_at` (ISO 8601)
7. **Given** la base contient 3 scores : 8000, 5000, 2000 **When** `POST /scores` est appelé avec `{"pseudo": "Karim", "score": 3000}` **Then** la réponse contient `{"id": <int>, "rank": 3}`
8. **Given** la base est vide **When** `POST /scores` est appelé avec n'importe quel score valide **Then** la réponse contient `"rank": 1`
9. **Given** l'API en cours d'exécution **When** la documentation est consultée à `/docs` **Then** les deux endpoints sont visibles et testables

## Tasks / Subtasks

- [x] Mettre en place l'application FastAPI avec CORS et démarrage DB (AC: #1, #9)
  - [x] Créer l'instance `app = FastAPI()`
  - [x] Charger `FRONTEND_ORIGIN` depuis les variables d'environnement
  - [x] Configurer `CORSMiddleware` avec `allow_origins=[FRONTEND_ORIGIN]`
  - [x] Appeler `create_tables()` au démarrage via `@app.on_event("startup")`
  - [x] Configurer SlowAPI : `limiter = Limiter(key_func=get_remote_address)`
  - [x] Ajouter `SlowAPIMiddleware` à l'app
  - [x] Ajouter le handler d'exception `rate_limit_exceeded_handler`
- [x] Implémenter le dependency injection de session DB (AC: #1, #2)
  - [x] Créer la fonction `get_db()` generator avec `try/finally`
- [x] Implémenter `POST /scores` avec calcul du rang (AC: #1, #2, #3, #4, #5, #7, #8)
  - [x] Décorer avec `@limiter.limit("10/minute")`
  - [x] Normaliser `pseudo` : si `None` ou chaîne vide → `"Anonyme"`
  - [x] Insérer le score en DB via SQLAlchemy
  - [x] Calculer le rang : `SELECT COUNT(*) FROM scores WHERE score > nouveau_score` + 1
  - [x] Retourner `RankResponse(id=..., rank=...)`
- [x] Implémenter `GET /scores/top10` (AC: #6)
  - [x] Requête : `SELECT * FROM scores ORDER BY score DESC LIMIT 10`
  - [x] Retourner `List[ScoreOut]`
- [x] Monter les fichiers statiques frontend APRÈS les routes API (AC: #9)
  - [x] `app.mount("/", StaticFiles(directory="frontend", html=True), name="static")`
- [x] Vérifier manuellement via `/docs` que les deux endpoints sont testables (AC: #9)

## Dev Notes

### Contexte

`backend/main.py` est le seul fichier à implémenter dans cette story. Il utilise les modules créés en Story 1.2 (`database.py`, `models.py`, `schemas.py`). C'est la dernière story de l'Epic 1 — après celle-ci, l'API est entièrement fonctionnelle localement.

**Fichiers disponibles depuis Story 1.2 :**
- `from backend.database import SessionLocal, create_tables` ✅
- `from backend.models import Score` ✅
- `from backend.schemas import ScoreIn, ScoreOut, RankResponse` ✅
- `backend/.env` présent avec `DATABASE_URL=sqlite:///./scores.db` ✅

---

### Implémentation complète de `backend/main.py`

```python
from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.middleware import SlowAPIMiddleware
from slowapi.errors import RateLimitExceeded
from typing import List
import os
from dotenv import load_dotenv

from backend.database import SessionLocal, create_tables
from backend.models import Score
from backend.schemas import ScoreIn, ScoreOut, RankResponse

load_dotenv()

FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:8080")

# === RATE LIMITING ===
limiter = Limiter(key_func=get_remote_address)

# === APP ===
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded. Try again later."},
    )

app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

@app.on_event("startup")
def startup():
    create_tables()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

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

@app.get("/scores/top10", response_model=List[ScoreOut])
def get_top10(db: Session = Depends(get_db)):
    return db.query(Score).order_by(Score.score.desc()).limit(10).all()

app.mount("/", StaticFiles(directory="frontend", html=True), name="static")
```

---

### Points critiques à ne pas rater

#### 1. Ordre des déclarations — CRITIQUE
Les routes API DOIVENT être déclarées **avant** `app.mount("/", StaticFiles(...))`.

#### 2. Signature de `POST /scores` avec SlowAPI
Le paramètre `request: Request` est **obligatoire** en première position.

#### 3. Handler 429 custom
Format exact du contrat API : `{"detail": "Rate limit exceeded. Try again later."}`

#### 4. Calcul du rang
`rank = db.query(Score).filter(Score.score > score_in.score).count() + 1`

#### 5. TestClient et startup event
Utiliser `with TestClient(app) as client:` pour déclencher `@on_event("startup")`.

### Project Structure Notes

- Seul `backend/main.py` est modifié dans cette story
- Pas de nouveaux fichiers à créer
- Pas de `backend/__init__.py` (conforme architecture)

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3]
- [Source: _bmad-output/implementation-artifacts/1-2-couche-donnees-connexion-db-et-modele-score.md]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Problème initial : `create_tables()` non déclenché par TestClient sans context manager `with`. Résolu en utilisant `with TestClient(app) as client:`.
- SlowAPI avec TestClient utilise l'IP `testclient` — le rate limit fonctionne correctement (10 OK + 11e → 429 confirmé).

### Completion Notes List

- ✅ `backend/main.py` implémenté : FastAPI, CORS, SlowAPI, startup, get_db(), POST /scores, GET /scores/top10, StaticFiles
- ✅ Handler 429 custom avec format `{"detail": "Rate limit exceeded. Try again later."}` confirmé
- ✅ AC1 : POST /scores → 200 `{"id": 1, "rank": 1}` ✓
- ✅ AC2 : POST sans pseudo → 200, pseudo normalisé "Anonyme" ✓
- ✅ AC3 : score=-1 et score=0 → 422 ✓
- ✅ AC4 : pseudo > 20 chars → 422 ✓
- ✅ AC5 : 11e requête → 429 `{"detail": "Rate limit exceeded. Try again later."}` ✓
- ✅ AC6 : GET /scores/top10 → 200, trié DESC, champs pseudo/score/created_at ✓
- ✅ AC7 : score=3000 dans [8000,5000,2000] → rank=3 ✓
- ✅ AC8 : base vide → rank=1 ✓
- ✅ AC9 : /docs → 200 ✓
- ✅ StaticFiles monté en dernier (vérifié par inspection des routes)
- ✅ Fichiers DB de test nettoyés après validation

### File List

- `backend/main.py`

### Change Log

- 2026-03-15 : Implémentation initiale — API FastAPI complète (POST /scores, GET /scores/top10, CORS, SlowAPI, StaticFiles)
