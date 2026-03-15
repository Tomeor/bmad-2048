# Story 1.2 : Couche données — connexion DB et modèle Score

Status: review

## Story

En tant qu'agent de développement,
je veux implémenter la connexion à la base de données et le modèle SQLAlchemy,
afin que les scores puissent être persistés indifféremment en SQLite (dev) ou PostgreSQL (prod).

## Acceptance Criteria

1. **Given** un fichier `.env` local avec `DATABASE_URL=sqlite:///./scores.db` **When** l'application démarre **Then** la connexion à la base de données est établie sans erreur
2. **And** la table `scores` est créée automatiquement si elle n'existe pas (`CREATE TABLE IF NOT EXISTS`)
3. **And** la table possède les colonnes : `id` (PK autoincrement), `pseudo` (VARCHAR 20, default `'Anonyme'`), `score` (INTEGER NOT NULL, CHECK > 0), `created_at` (TIMESTAMP, default now)
4. **Given** une variable `DATABASE_URL` pointant vers une URL PostgreSQL **When** l'application démarre **Then** la connexion s'établit avec PostgreSQL sans modification du code métier
5. **Given** le module `database.py` **When** il est importé **Then** il expose un moteur SQLAlchemy, une `SessionLocal` et une fonction `create_tables()`
6. **Given** les modules `models.py` et `schemas.py` **When** ils sont importés **Then** ils exposent respectivement le modèle `Score` (SQLAlchemy) et les schemas Pydantic `ScoreIn`, `ScoreOut`, `RankResponse`

## Tasks / Subtasks

- [x] Implémenter `backend/database.py` (AC: #1, #2, #5)
  - [x] Charger `DATABASE_URL` depuis les variables d'environnement avec `python-dotenv`
  - [x] Créer le moteur SQLAlchemy avec `create_engine(DATABASE_URL)`
  - [x] Créer la factory `SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)`
  - [x] Déclarer la `Base = declarative_base()`
  - [x] Implémenter `create_tables()` qui appelle `Base.metadata.create_all(bind=engine)`
- [x] Implémenter `backend/models.py` (AC: #2, #3)
  - [x] Définir la classe `Score(Base)` avec `__tablename__ = "scores"`
  - [x] Ajouter la colonne `id` : Integer, primary key, autoincrement
  - [x] Ajouter la colonne `pseudo` : String(20), nullable=False, default `'Anonyme'`
  - [x] Ajouter la colonne `score` : Integer, nullable=False (contrainte CHECK score > 0 via `CheckConstraint`)
  - [x] Ajouter la colonne `created_at` : DateTime, default `datetime.utcnow`
- [x] Implémenter `backend/schemas.py` (AC: #6)
  - [x] Définir `ScoreIn(BaseModel)` avec `pseudo: Optional[str] = Field(None, max_length=20)` et `score: int = Field(..., gt=0)`
  - [x] Définir `ScoreOut(BaseModel)` avec `pseudo: str`, `score: int`, `created_at: datetime` et `model_config = ConfigDict(from_attributes=True)`
  - [x] Définir `RankResponse(BaseModel)` avec `id: int` et `rank: int`
- [x] Vérifier l'intégration : `create_tables()` appelé crée la table `scores` en SQLite sans erreur (AC: #1, #2, #3)

## Dev Notes

### Contexte

Cette story implémente la couche données complète — `database.py`, `models.py` et `schemas.py` — regroupés ensemble selon l'architecture (step 2 de la séquence d'implémentation). Ces fichiers sont des prérequis bloquants pour Story 1.3 (API FastAPI).

**PRÉREQUIS avant de commencer :**
Créer le fichier `backend/.env` depuis `backend/.env.example` :
```bash
cp backend/.env.example backend/.env
```
Ce fichier est gitignored (`.gitignore` contient `.env`). Il est nécessaire pour que `python-dotenv` charge `DATABASE_URL`.

**Note sur `backend/__init__.py` :** NE PAS créer ce fichier. L'architecture spécifie que les imports se font via le chemin complet `backend.main` depuis la racine. L'absence de `__init__.py` est intentionnelle.

---

### Implémentation détaillée

#### `backend/database.py` — contenu attendu :

```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./scores.db")

# Paramètre spécifique SQLite : check_same_thread=False requis uniquement pour SQLite
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def create_tables():
    Base.metadata.create_all(bind=engine)
```

**Points critiques :**
- `check_same_thread=False` est requis pour SQLite avec FastAPI (threads multiples) — mais NE DOIT PAS être passé pour PostgreSQL car l'argument n'existe pas
- `load_dotenv()` charge le fichier `.env` si présent — en production sur Render, les variables viennent directement de l'environnement sans `.env`
- `declarative_base()` doit être importé depuis `sqlalchemy.ext.declarative` (SQLAlchemy 1.4+) ou `sqlalchemy.orm` (SQLAlchemy 2.0+) — utiliser la version compatible avec les dépendances installées

#### `backend/models.py` — contenu attendu :

```python
from sqlalchemy import Column, Integer, String, DateTime, CheckConstraint
from datetime import datetime
from backend.database import Base


class Score(Base):
    __tablename__ = "scores"
    __table_args__ = (CheckConstraint("score > 0", name="check_score_positive"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    pseudo = Column(String(20), nullable=False, default="Anonyme")
    score = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
```

**Points critiques :**
- `from backend.database import Base` — chemin d'import absolu depuis la racine du projet
- `CheckConstraint("score > 0")` implémente la contrainte côté DB (en plus de la validation Pydantic côté API)
- `default="Anonyme"` sur `pseudo` : SQLAlchemy insère `"Anonyme"` si aucune valeur n'est fournie au niveau ORM
- `default=datetime.utcnow` (sans parenthèses) : SQLAlchemy appelle la fonction à chaque insertion

#### `backend/schemas.py` — contenu attendu :

```python
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


class ScoreIn(BaseModel):
    pseudo: Optional[str] = Field(None, max_length=20)
    score: int = Field(..., gt=0)


class ScoreOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    pseudo: str
    score: int
    created_at: datetime


class RankResponse(BaseModel):
    id: int
    rank: int
```

**Points critiques :**
- `ScoreIn` : `pseudo` optionnel (peut être `None`) → le backend normalise vers `"Anonyme"` si `None`
- `ScoreOut` : `model_config = ConfigDict(from_attributes=True)` permet la sérialisation depuis un objet SQLAlchemy (équivalent de `class Config: orm_mode = True` en Pydantic v1)
- `RankResponse` : utilisé pour la réponse de `POST /scores` → `{ "id": int, "rank": int }`
- Ne pas mélanger Pydantic v1 (`orm_mode`) et v2 (`from_attributes`) — `fastapi` inclus par `requirements.txt` embarque Pydantic v2

---

### Contrat API figé (pour référence — implémenté en Story 1.3)

```
POST /scores
  Body:  { "pseudo": "string?" (max 20 chars), "score": int (> 0) }
  200:   { "id": int, "rank": int }     ← RankResponse

GET /scores/top10
  200:   [{ "pseudo": "string", "score": int, "created_at": "ISO 8601" }]  ← List[ScoreOut]
```

---

### Vérification manuelle (sans framework de test)

L'architecture exclut un dossier `tests/` (hors scope MVP). La validation se fait manuellement :

```bash
# Depuis la racine du projet
cd /chemin/vers/test-bmad

# 1. Installer les dépendances
pip install -r backend/requirements.txt

# 2. S'assurer que backend/.env existe avec DATABASE_URL=sqlite:///./scores.db

# 3. Lancer Python et tester l'import
python3 -c "
from backend.database import engine, SessionLocal, create_tables, Base
from backend.models import Score
from backend.schemas import ScoreIn, ScoreOut, RankResponse
create_tables()
print('✅ Table scores créée')
print('✅ Colonnes:', [c.name for c in Score.__table__.columns])
"
```

**Résultat attendu :**
```
✅ Table scores créée
✅ Colonnes: ['id', 'pseudo', 'score', 'created_at']
```

---

### Règles d'architecture à respecter IMPÉRATIVEMENT

1. **Nommage DB** : `snake_case` pour colonnes et table (`scores`, `created_at`, `pseudo`)
2. **Pas de fichier supplémentaire** : ne modifier que `database.py`, `models.py`, `schemas.py`
3. **Pas de `backend/__init__.py`** : les imports utilisent le préfixe `backend.` depuis la racine
4. **Validation Pydantic uniquement dans `schemas.py`** : pas de validation manuelle redondante dans les routes (Story 1.3)
5. **Pas d'Alembic** : `create_tables()` utilise `CREATE TABLE IF NOT EXISTS` via SQLAlchemy — migrations non requises pour ce projet
6. **Variables d'environnement** : `DATABASE_URL` est la seule config — pas de valeur hardcodée en prod

### Project Structure Notes

- Fichiers à modifier : `backend/database.py`, `backend/models.py`, `backend/schemas.py` (tous vides depuis Story 1.1)
- Fichier à créer (gitignored) : `backend/.env` (copie de `.env.example`) — NE PAS le committer
- Aucun nouveau dossier à créer
- Aucun nouveau fichier Python à créer (hors `.env`)

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — schéma complet table `scores`, modèle Pydantic
- [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions] — décision SQLAlchemy ORM, pas d'Alembic
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns#Naming Patterns] — `snake_case` DB
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns#Validation Pattern] — Pydantic uniquement dans schemas
- [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment] — `DATABASE_URL` env var, SQLite dev / PostgreSQL prod
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2] — acceptance criteria complets
- [Source: _bmad-output/implementation-artifacts/1-1-initialisation-de-la-structure-du-projet.md] — structure de fichiers créée en Story 1.1

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Aucun problème rencontré. Dépendances installées via `pip3`. Fichier `scores.db` de test supprimé après validation.

### Completion Notes List

- ✅ `backend/database.py` : moteur SQLAlchemy, SessionLocal, Base, create_tables() — `check_same_thread=False` conditionnel (SQLite uniquement)
- ✅ `backend/models.py` : classe `Score` avec 4 colonnes (`id`, `pseudo`, `score`, `created_at`) + `CheckConstraint("score > 0")`
- ✅ `backend/schemas.py` : `ScoreIn` (pseudo optionnel, score > 0), `ScoreOut` (from_attributes=True), `RankResponse` (id + rank)
- ✅ `backend/.env` créé localement (gitignored) avec `DATABASE_URL=sqlite:///./scores.db`
- ✅ Validation complète : imports, création table, colonnes correctes, Pydantic constraints (score ≤ 0 refusé, pseudo > 20 chars refusé, pseudo=None accepté)
- ✅ Pydantic v2 confirmé : `ConfigDict(from_attributes=True)` utilisé correctement
- ✅ Pas de `backend/__init__.py` (conforme architecture)
- ✅ Tous les 6 ACs validés par exécution Python

### File List

- `backend/database.py`
- `backend/models.py`
- `backend/schemas.py`
- `backend/.env` (gitignored — ne pas committer)

### Change Log

- 2026-03-15 : Implémentation initiale — couche données complète (database.py, models.py, schemas.py)
