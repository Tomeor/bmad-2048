# Story 4.1 : Configuration du déploiement Render.com

Status: done

## Story

En tant qu'agent de développement,
je veux configurer `render.yaml` et préparer le projet pour le déploiement sur Render.com,
afin que l'application soit accessible via une URL publique HTTPS avec déploiement automatique depuis Git.

## Acceptance Criteria

1. **Given** le fichier `render.yaml` à la racine du projet **When** il est inspecté **Then** il définit un service web de type `python` nommé `test-bmad` **And** le `buildCommand` est `pip install -r backend/requirements.txt` **And** le `startCommand` est `uvicorn backend.main:app --host 0.0.0.0 --port $PORT` **And** la variable `DATABASE_URL` est liée à la base PostgreSQL `test-bmad-db` via `fromDatabase` **And** la variable `FRONTEND_ORIGIN` est définie avec l'URL Render attendue **And** une base de données PostgreSQL `test-bmad-db` (plan free) est déclarée
2. **Given** `main.py` **When** il est inspecté **Then** FastAPI sert les fichiers statiques du dossier `frontend/` via `StaticFiles` monté sur `/` **And** les routes API (`/scores`, `/scores/top10`) sont déclarées avant le mount `StaticFiles` pour avoir la priorité
3. **Given** un push Git sur la branche principale **When** Render.com détecte le push **Then** le build se déclenche automatiquement (FR30) **And** le service démarre avec `uvicorn` sans erreur
4. **Given** le service démarré sur Render.com **When** l'URL publique est visitée **Then** la page est accessible via HTTPS (FR27) **And** le certificat SSL est valide (géré automatiquement par Render.com)

## Tasks / Subtasks

- [x] Écrire le contenu complet de `render.yaml` à la racine du projet (AC: #1)
  - [x] Section `services` : type `web`, name `test-bmad`, env `python`
  - [x] `buildCommand: pip install -r backend/requirements.txt`
  - [x] `startCommand: uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
  - [x] Variable `DATABASE_URL` : `fromDatabase.name = test-bmad-db`, `property = connectionString`
  - [x] Variable `FRONTEND_ORIGIN` : `value = https://test-bmad.onrender.com`
  - [x] Section `databases` : name `test-bmad-db`, plan `free`
- [x] Vérifier que `backend/main.py` a le bon ordre routes API → StaticFiles (AC: #2)
  - [x] Routes `/scores` (POST) et `/scores/top10` (GET) déclarées AVANT le `app.mount("/")`
  - [x] `StaticFiles(directory="frontend", html=True)` monté sur `/`
  - [x] Aucune modification requise — déjà correct depuis Story 1.3
- [x] Vérifier `backend/requirements.txt` complet pour Render (AC: #3)
  - [x] Contient `psycopg2-binary` (driver PostgreSQL pour la prod)
  - [x] Contient `fastapi`, `uvicorn[standard]`, `sqlalchemy`, `python-dotenv`, `slowapi`
  - [x] Aucune modification requise — déjà complet depuis Story 1.1

## Dev Notes

### Contexte et contraintes critiques

**FICHIER PRINCIPAL À MODIFIER :** `render.yaml` à la racine du projet.

**Fichiers à vérifier (ne devraient PAS nécessiter de modification) :**
- `backend/main.py` — StaticFiles monté correctement en Story 1.3
- `backend/requirements.txt` — complet depuis Story 1.1

**Stratégie de déploiement :** Mono-service FastAPI

FastAPI sert à la fois l'API REST et les fichiers statiques frontend — une seule URL Render, pas de CORS nécessaire en production (même origine). Le middleware CORS est configuré (Story 1.3) mais il est fonctionnel grâce à `FRONTEND_ORIGIN` qui pointe vers la même URL.

---

### Implémentation complète — `render.yaml`

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

---

### Points critiques à ne pas rater

#### 1. `$PORT` — variable d'environnement injectée par Render
Render injecte automatiquement la variable `PORT` dans le service web. `uvicorn` doit écouter sur ce port dynamique via `--port $PORT`. **Ne pas hardcoder `8000`** — le service écouterait sur le mauvais port.

#### 2. `fromDatabase` — liaison automatique à la base PostgreSQL
Le bloc `fromDatabase` permet à Render de lier automatiquement la string de connexion PostgreSQL sans jamais exposer les credentials en clair dans le fichier YAML. Render injecte la valeur de `DATABASE_URL` lors du déploiement.

#### 3. `FRONTEND_ORIGIN = https://test-bmad.onrender.com`
L'URL Render est dérivée du `name` du service (`test-bmad`) et suit le pattern `https://{name}.onrender.com`. Cette valeur est utilisée par le middleware CORS dans `main.py` :
```python
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:8080")
app.add_middleware(CORSMiddleware, allow_origins=[FRONTEND_ORIGIN], ...)
```
En production (mono-service), le frontend et le backend partagent la même URL → pas de problème CORS réel, mais la configuration est nécessaire et validée en Story 4.2.

#### 4. `psycopg2-binary` obligatoire pour PostgreSQL Render
`backend/requirements.txt` contient déjà `psycopg2-binary`. C'est le driver Python PostgreSQL nécessaire pour la prod. Sans lui, SQLAlchemy ne peut pas se connecter à la base PostgreSQL Render.

#### 5. `html=True` dans `StaticFiles` — routing SPA
```python
app.mount("/", StaticFiles(directory="frontend", html=True), name="static")
```
Le paramètre `html=True` permet à Starlette de servir automatiquement `index.html` pour les routes non-API. Indispensable pour une SPA.

#### 6. Ordre de montage — routes API avant StaticFiles
FastAPI résout les routes dans l'ordre de déclaration. Si `StaticFiles` était monté avant les routes API, toutes les requêtes vers `/scores` seraient interceptées par le serveur de fichiers statiques (et retourneraient 404).

Ordre actuel dans `main.py` (correct) :
```python
# 1. Routes API
@app.post("/scores", ...)
@app.get("/scores/top10", ...)

# 2. StaticFiles (EN DERNIER)
app.mount("/", StaticFiles(directory="frontend", html=True), name="static")
```

#### 7. `plan: free` pour la base PostgreSQL
Render Free Tier PostgreSQL : 1 GB stockage, expirera après 90 jours d'inactivité, puis les données sont supprimées. Suffisant pour le projet d'apprentissage.

---

### Procédure de déploiement manuelle (pour Thomas après l'implémentation)

Les ACs #3 et #4 nécessitent une action manuelle sur Render.com — l'agent dev ne peut pas les automatiser :

1. **Créer un compte Render.com** (si pas encore fait)
2. **Connecter le dépôt Git** (GitHub/GitLab) dans le dashboard Render
3. **New → Blueprint** → sélectionner le repo → Render détecte `render.yaml` automatiquement
4. **Render crée** : le service web `test-bmad` + la base PostgreSQL `test-bmad-db`
5. **Premier build** : Render installe les dépendances (`pip install`) et démarre uvicorn
6. **URL publique** : `https://test-bmad.onrender.com` avec HTTPS automatique

**Note :** Si le nom `test-bmad` est déjà pris sur Render, l'URL sera différente (ex. `test-bmad-xyz.onrender.com`). Dans ce cas, il faudra mettre à jour `FRONTEND_ORIGIN` dans les variables d'environnement Render (pas dans `render.yaml` — car `render.yaml` est public).

---

### Vérification post-déploiement (tests manuels)

Une fois déployé :
```bash
# Test API depuis terminal
curl https://test-bmad.onrender.com/scores/top10

# Attendu : [] ou [{ "pseudo": "...", "score": ..., "created_at": "..." }]

# Test soumission score
curl -X POST https://test-bmad.onrender.com/scores \
  -H "Content-Type: application/json" \
  -d '{"pseudo": "TestDeploy", "score": 1234}'

# Attendu : { "id": 1, "rank": 1 }
```

---

### Vérification de `backend/main.py` — contenu attendu (Story 1.3)

Extrait confirmé de `backend/main.py:94-95` :
```python
# === STATIC FILES (montées EN DERNIER — après toutes les routes API) ===
app.mount("/", StaticFiles(directory="frontend", html=True), name="static")
```

Routes API (lignes 71-91) déclarées avant → ordre correct ✅

---

### Vérification de `backend/requirements.txt` — contenu attendu (Story 1.1)

```
fastapi
uvicorn[standard]
sqlalchemy
psycopg2-binary
python-dotenv
slowapi
```

Complet pour le déploiement PostgreSQL Render ✅

---

### Learnings from Story 3.2 (previous)

- Story 3.2 n'a pas eu de problèmes — implémentation pure frontend (app.js)
- 71 tests passés, pas de régression

### Project Structure Notes

- Fichier créé/modifié : `render.yaml` (racine du projet)
- Aucune modification du code backend ou frontend requise
- Cette story est essentiellement une story de configuration

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.1] — ACs complets
- [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment] — contenu exact render.yaml
- [Source: backend/main.py:94-95] — StaticFiles monté correctement
- [Source: backend/requirements.txt] — dépendances complètes dont psycopg2-binary
- [Source: backend/.env.example] — variables d'environnement référencées

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Aucun problème rencontré. 29 tests Node.js passés, 0 échoués.

### Completion Notes List

- ✅ `render.yaml` écrit : service `test-bmad` (type web, env python), `buildCommand`, `startCommand` avec `$PORT`, `DATABASE_URL` via `fromDatabase` → `test-bmad-db`, `FRONTEND_ORIGIN = https://test-bmad.onrender.com`, base PostgreSQL `test-bmad-db` plan free
- ✅ `backend/main.py` vérifié : StaticFiles sur `/` avec `html=True`, routes API (`/scores`, `/scores/top10`) déclarées AVANT le mount — aucune modification requise
- ✅ `backend/requirements.txt` vérifié : `psycopg2-binary` présent pour PostgreSQL prod — aucune modification requise
- ✅ 29 tests : render.yaml structure (2), service web (3), buildCommand/startCommand (3), env vars (6), databases (2), main.py StaticFiles (2), main.py ordre routes (5), requirements.txt (6)
- ℹ️ ACs #3 et #4 (push Git → build Render, URL HTTPS) nécessitent une action manuelle de Thomas sur Render.com — procédure documentée dans Dev Notes

### File List

- `render.yaml`
- `test-story-4-1.js`

### Change Log

- 2026-03-15 : Écriture complète de `render.yaml` (service web Python + PostgreSQL Render free tier) ; vérification `main.py` et `requirements.txt` sans modification requise
