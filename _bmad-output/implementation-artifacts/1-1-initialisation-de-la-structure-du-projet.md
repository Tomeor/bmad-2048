# Story 1.1 : Initialisation de la structure du projet

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant qu'agent de développement,
je veux créer la structure complète de fichiers et dossiers du projet,
afin que le projet soit prêt à recevoir l'implémentation du backend et du frontend.

## Acceptance Criteria

1. **Given** un répertoire de projet vide **When** la structure est initialisée **Then** les dossiers `frontend/` et `backend/` existent
2. **And** les fichiers `frontend/index.html`, `frontend/style.css`, `frontend/app.js` sont créés (vides)
3. **And** les fichiers `backend/main.py`, `backend/models.py`, `backend/database.py`, `backend/schemas.py` sont créés (vides)
4. **And** `backend/requirements.txt` contient exactement : `fastapi`, `uvicorn[standard]`, `sqlalchemy`, `psycopg2-binary`, `python-dotenv`, `slowapi`
5. **And** `backend/.env.example` contient les clés `DATABASE_URL` et `FRONTEND_ORIGIN` avec des valeurs d'exemple
6. **And** `render.yaml` est créé (vide, prêt pour Epic 4)
7. **And** `README.md` est créé avec le nom du projet
8. **And** `.gitignore` couvre : `__pycache__/`, `*.pyc`, `.env`, `*.db`, `.DS_Store`

## Tasks / Subtasks

- [x] Créer la structure de dossiers (AC: #1)
  - [x] Créer le dossier `frontend/`
  - [x] Créer le dossier `backend/`
- [x] Créer les fichiers frontend vides (AC: #2)
  - [x] `frontend/index.html` (fichier vide)
  - [x] `frontend/style.css` (fichier vide)
  - [x] `frontend/app.js` (fichier vide)
- [x] Créer les fichiers backend vides (AC: #3)
  - [x] `backend/main.py` (fichier vide)
  - [x] `backend/models.py` (fichier vide)
  - [x] `backend/database.py` (fichier vide)
  - [x] `backend/schemas.py` (fichier vide)
- [x] Créer `backend/requirements.txt` avec les dépendances exactes (AC: #4)
- [x] Créer `backend/.env.example` avec les variables d'environnement requises (AC: #5)
- [x] Créer `render.yaml` vide à la racine (AC: #6)
- [x] Créer `README.md` avec le nom du projet (AC: #7)
- [x] Créer `.gitignore` avec les règles requises (AC: #8)

## Dev Notes

### Contexte et Objectif

Cette story est **purement structurelle** — pas de logique applicative, pas de code fonctionnel. Son seul objectif est de créer l'arborescence de fichiers exacte définie par l'architecture, prêt pour les stories suivantes.

**IMPORTANT :** Les fichiers frontend (`index.html`, `style.css`, `app.js`) et backend (`main.py`, `models.py`, `database.py`, `schemas.py`) doivent être créés **vides** — leur contenu sera implémenté dans Epic 2 et les stories suivantes de l'Epic 1.

### Contenu des Fichiers Critiques

#### `backend/requirements.txt` — contenu exact :
```
fastapi
uvicorn[standard]
sqlalchemy
psycopg2-binary
python-dotenv
slowapi
```

#### `backend/.env.example` — contenu exact :
```
DATABASE_URL=sqlite:///./scores.db
FRONTEND_ORIGIN=http://localhost:8080
```
> Note : `DATABASE_URL` utilise SQLite pour le dev local. En production sur Render, ce sera une URL PostgreSQL. `FRONTEND_ORIGIN` sera l'URL Render du frontend en production.

#### `.gitignore` — contenu minimal requis :
```
__pycache__/
*.pyc
.env
*.db
.DS_Store
```

#### `README.md` — contenu minimal :
```markdown
# test-bmad

Jeu 2048 en ligne avec leaderboard public.
```

#### `render.yaml` — fichier vide à la racine (sera rempli en Epic 4) :
```yaml
# Configuration Render.com — sera complété en Epic 4
```

### Structure Complète du Projet

```
test-bmad/               ← racine du projet (répertoire de travail actuel)
├── .gitignore
├── README.md
├── render.yaml
├── frontend/
│   ├── index.html       ← SPA unique, vide pour cette story
│   ├── style.css        ← vide pour cette story
│   └── app.js           ← vide pour cette story
└── backend/
    ├── main.py          ← vide pour cette story
    ├── models.py        ← vide pour cette story
    ├── database.py      ← vide pour cette story
    ├── schemas.py       ← vide pour cette story
    ├── requirements.txt ← avec les 6 dépendances exactes
    └── .env.example     ← avec DATABASE_URL et FRONTEND_ORIGIN
```

### Project Structure Notes

- **Pas de dossier `tests/`** — hors scope MVP (architecture.md : "Pas de dossier tests/ (hors scope MVP)")
- **Pas de modules supplémentaires** — un seul `app.js`, un seul `style.css`
- **Pas de `backend/__init__.py`** — non requis pour cette structure (les imports se font via le chemin complet `backend.main` depuis la racine)
- La racine du projet = répertoire de travail actuel (`test-bmad/`) — ne pas créer de sous-dossier supplémentaire

### Contraintes Architecturales à Respecter

- **Stack vanilla** : HTML/CSS/JS pur, pas de framework, pas de build step
- **Backend FastAPI** : Python 3.11+
- **Pas de valeurs hardcodées** pour la configuration — tout via variables d'environnement (`.env` et `.env.example`)
- **Un seul service Render** : mono-service FastAPI qui servira à la fois l'API et les fichiers statiques

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Starter Template Evaluation] — structure de projet complète, commandes d'initialisation
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries] — arborescence définitive
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — règles de nommage et organisation
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1] — acceptance criteria complets
- [Source: _bmad-output/planning-artifacts/prd.md#Technical Requirements] — contraintes stack et déploiement

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Aucun — implémentation purement structurelle, aucun problème rencontré.

### Completion Notes List

- ✅ Dossiers `frontend/` et `backend/` créés à la racine du projet
- ✅ 3 fichiers frontend créés vides : `index.html`, `style.css`, `app.js`
- ✅ 4 fichiers backend créés vides : `main.py`, `models.py`, `database.py`, `schemas.py`
- ✅ `backend/requirements.txt` avec les 6 dépendances exactes (fastapi, uvicorn[standard], sqlalchemy, psycopg2-binary, python-dotenv, slowapi)
- ✅ `backend/.env.example` avec `DATABASE_URL` (SQLite dev) et `FRONTEND_ORIGIN` (localhost:8080)
- ✅ `render.yaml` créé avec commentaire indicatif (sera complété en Epic 4)
- ✅ `README.md` créé avec titre et description du projet
- ✅ `.gitignore` couvre `__pycache__/`, `*.pyc`, `.env`, `*.db`, `.DS_Store`
- ✅ Pas de `backend/__init__.py` (non requis, conforme à l'architecture)
- ✅ Pas de dossier `tests/` (hors scope MVP)
- ✅ Tous les 8 ACs vérifiés et validés

### File List
- `.gitignore`
- `README.md`
- `render.yaml`
- `frontend/index.html`
- `frontend/style.css`
- `frontend/app.js`
- `backend/main.py`
- `backend/models.py`
- `backend/database.py`
- `backend/schemas.py`
- `backend/requirements.txt`
- `backend/.env.example`

### Change Log

- 2026-03-15 : Implémentation initiale — création de l'arborescence complète du projet (12 fichiers, 2 dossiers)
