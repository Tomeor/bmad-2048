---
stepsCompleted: ["step-01-validate-prerequisites", "step-02-design-epics", "step-03-create-stories", "step-04-final-validation"]
status: "complete"
completedAt: "2026-03-15"
inputDocuments: ["prd.md", "architecture.md", "ux-design-specification.md"]
---

# test-bmad - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for test-bmad, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Le joueur peut démarrer une partie de 2048 sans inscription ni action préalable
FR2: Le joueur peut déplacer les tuiles avec les touches directionnelles (desktop)
FR3: Le joueur peut déplacer les tuiles avec des gestes de swipe (mobile)
FR4: Le système détecte automatiquement la fin de partie (aucun mouvement possible)
FR5: Le joueur voit son score mis à jour en temps réel pendant la partie
FR6: Le joueur peut relancer une nouvelle partie à tout moment via un bouton "Rejouer"
FR7: Le joueur peut saisir un pseudo (optionnel) à la fin de la partie
FR8: Le joueur peut soumettre son score avec ou sans pseudo
FR9: Le système soumet le score sous le label "Anonyme" si aucun pseudo n'est fourni
FR10: Le système affiche un message d'erreur clair si la soumission échoue
FR11: Le joueur peut réessayer la soumission en cas d'échec, sans perdre son score
FR12: Le joueur (desktop) voit le Top 10 des scores dès l'arrivée sur la page
FR13: Le joueur (mobile) voit le Top 10 uniquement après la fin de partie
FR14: Le leaderboard se met à jour après chaque soumission réussie
FR15: Le leaderboard affiche pour chaque entrée : pseudo, score et date
FR16: Le système expose un endpoint pour soumettre un score (pseudo + valeur entière)
FR17: Le système expose un endpoint pour récupérer le Top 10 des scores
FR18: Le système valide les données entrantes (pseudo max 20 chars, score entier positif)
FR19: Le système limite les soumissions à 10 par IP par minute
FR20: Le système retourne une réponse d'erreur explicite en cas de dépassement du rate limit
FR21: Le système stocke chaque soumission de manière persistante (survit aux redémarrages)
FR22: L'interface utilise une palette de couleurs pastel
FR23: L'interface affiche des motifs géométriques en arrière-plan
FR24: L'interface affiche un badge "Made with AI"
FR25: Sur mobile, la grille occupe la totalité de l'écran pendant la partie
FR26: Sur desktop, la grille et le leaderboard sont visibles simultanément
FR27: Le site est accessible via une URL publique avec HTTPS
FR28: Le backend autorise uniquement les requêtes provenant de l'origine du frontend (CORS)
FR29: Les secrets de configuration sont gérés via variables d'environnement
FR30: Le déploiement se déclenche automatiquement depuis un push Git

### NonFunctional Requirements

NFR1: Chargement initial (HTML + CSS + JS + données leaderboard) < 2 secondes sur connexion standard
NFR2: Actions de jeu (déplacement de tuiles) traitées localement en < 100ms (aucun appel réseau)
NFR3: Appels API (POST /scores, GET /scores/top10) répondent en < 1 seconde en conditions normales
NFR4: Toutes les communications frontend ↔ backend via HTTPS
NFR5: CORS restreint à l'origine frontend déclarée en variable d'environnement
NFR6: Entrées (pseudo, score) validées et sanitisées côté backend avant tout traitement
NFR7: Soumissions limitées à 10 par IP par minute — réponse 429 si dépassé
NFR8: Aucune donnée sensible (mot de passe, email, paiement) collectée ou stockée
NFR9: Contraste texte/fond ≥ 4.5:1 sur tous les fonds pastels (WCAG AA)
NFR10: Jeu utilisable au clavier sur desktop (touches directionnelles) et tactile sur mobile (swipe)
NFR11: Support navigateurs modernes : Chrome, Firefox, Safari, Edge (2 dernières versions majeures)

### Additional Requirements

- **Structure de projet manuelle** : pas de starter CLI, initialisation via création manuelle des dossiers et fichiers (frontend/ + backend/) — Epic 1, Story 1
- **Mono-service Render** : FastAPI sert à la fois l'API REST et les fichiers statiques frontend via `StaticFiles` (même URL, pas de CORS à gérer en prod)
- **Base de données duale** : SQLite local (dev) / PostgreSQL Render free tier (prod) via variable `DATABASE_URL` — même code SQLAlchemy sans modification
- **Pas d'Alembic** : création de table via `CREATE TABLE IF NOT EXISTS` au démarrage de l'app
- **Rate limiting** : SlowAPI (middleware FastAPI) — 10 req/IP/min sur `POST /scores`, réponse `429`
- **Validation Pydantic** : toutes les entrées validées avant insertion DB — pas de validation manuelle redondante dans les routes
- **bestScore localStorage** : persisté côté frontend via `localStorage`, survit aux rechargements sans backend
- **Contrat API figé** : `POST /scores` → `{ "id": int, "rank": int }` ; `GET /scores/top10` → `[{ "pseudo", "score", "created_at" (ISO 8601) }]`
- **Un seul fichier JS** (`app.js`) et **un seul fichier CSS** (`style.css`) — pas de modules supplémentaires
- **Ordre d'implémentation recommandé** : 1. Structure fichiers → 2. Couche données (database.py, models.py, schemas.py) → 3. API (main.py) → 4. Frontend HTML/CSS → 5. Logique JS + intégration API → 6. Déploiement Render

### UX Design Requirements

UX-DR1: Implémenter les variables CSS design tokens en `:root` — palette pastel complète (--color-bg: #F5F0EB, --color-surface: #FFFFFF, --color-grid-bg: #E8E0D8, --color-cell-empty: #D4C9BE, --color-primary: #8B7BA8, --color-success: #7DB5A0, --color-text: #3D3540, --color-text-light: #8A7E8A) et couleurs de tuiles par palier (2→2048+, dégradé pêche clair → violet profond)
UX-DR2: Implémenter le composant GameGrid — grille 4×4 CSS Grid (`repeat(4, 1fr)`), `width: min(80vw, 400px)`, `role="grid"`, `aria-label="Grille de jeu 2048"`, états cellule vide / valeur / fusion
UX-DR3: Implémenter le composant Tile — animations CSS (`transition: transform 80ms ease-out`), flash de fusion (scale 1.1→1.0), couleur de fond spécifique par palier de valeur
UX-DR4: Implémenter le composant ScoreBox — label + valeur, micro-animation "+N" qui monte et disparaît sur incrémentation, variants score courant / meilleur score (persisté localStorage)
UX-DR5: Implémenter le composant GameOverModal — overlay + carte (score final, input pseudo placeholder "Ton pseudo (optionnel)", bouton Enregistrer, bouton Rejouer), états visible/chargement/erreur, `role="dialog"` `aria-modal="true"`, focus trap
UX-DR6: Implémenter le composant Leaderboard — liste Top 10 avec LeaderboardRow (médaille or/argent/bronze top 3, pseudo, score, date), états : skeleton 3 barres (chargement initial) / message "Sois le premier !" (vide) / rempli / highlight nouvelle entrée (post-soumission)
UX-DR7: Implémenter le composant ErrorMessage — icône ⚠️ + texte rouge doux (#E87070) + bouton Réessayer, variant inline dans la modale
UX-DR8: Implémenter le composant AIBadge — "Made with AI ✨", position coin fixe, décoratif (aria-hidden)
UX-DR9: Implémenter le layout responsive mobile-first — breakpoint unique `768px` ; mobile : 1 colonne, grille plein écran, leaderboard masqué pendant la partie ; desktop : Flexbox 2 colonnes (~60% grille / ~40% leaderboard), `max-width: 960px` centré, `padding: 32px`
UX-DR10: Implémenter les contrôles swipe tactiles — événements `touchstart`/`touchend`, calcul delta X/Y pour détecter la direction, identique en comportement aux touches clavier
UX-DR11: Implémenter l'animation de la modale — ouverture `scale(0.95→1)` + `opacity(0→1)` en 150ms, fermeture uniquement via "Rejouer" (pas de croix, pas de clic overlay), focus trap actif pendant ouverture
UX-DR12: Implémenter les états de chargement — skeleton 3 barres animées pour leaderboard initial, bouton désactivé + texte "Enregistrement…" pendant soumission (pas de spinner overlay)
UX-DR13: Implémenter la hiérarchie des boutons — Primary (fond #8B7BA8, texte blanc, border-radius 10px) / Secondary (fond #F5F0EB, texte #3D3540, même shape) / jamais 2 boutons primary côte à côte
UX-DR14: Implémenter le fond géométrique — pattern CSS pur via `background-image` (SVG inline ou motif CSS répété), aucun `<img>` décoratif
UX-DR15: Implémenter l'accessibilité WCAG AA — contraste ≥ 4.5:1, cibles tactiles ≥ 48×48px sur mobile, outline focus `2px solid #8B7BA8` sur tous éléments focusables, `aria-live` sur le score, HTML sémantique (`<main>`, `<section>`, `<h1>`, `<button>`, pas de divs cliquables)

### FR Coverage Map

FR1: Epic 2 — Le joueur démarre une partie sans inscription
FR2: Epic 2 — Déplacement des tuiles au clavier (desktop)
FR3: Epic 2 — Déplacement des tuiles par swipe (mobile)
FR4: Epic 2 — Détection automatique de la fin de partie
FR5: Epic 2 — Score mis à jour en temps réel pendant la partie
FR6: Epic 2 — Bouton "Rejouer" pour relancer une partie
FR7: Epic 3 — Saisie du pseudo (optionnel) en fin de partie
FR8: Epic 3 — Soumission du score avec ou sans pseudo
FR9: Epic 3 — Soumission sous "Anonyme" si pseudo vide
FR10: Epic 3 — Message d'erreur clair si la soumission échoue
FR11: Epic 3 — Retry possible sans perdre le score
FR12: Epic 3 — Leaderboard Top 10 visible dès l'arrivée (desktop)
FR13: Epic 3 — Leaderboard Top 10 visible après fin de partie (mobile)
FR14: Epic 3 — Leaderboard mis à jour après soumission réussie
FR15: Epic 3 — Leaderboard affiche pseudo, score et date
FR16: Epic 1 — Endpoint POST /scores
FR17: Epic 1 — Endpoint GET /scores/top10
FR18: Epic 1 — Validation des entrées (pseudo ≤ 20 chars, score > 0)
FR19: Epic 1 — Rate limiting 10 req/IP/min
FR20: Epic 1 — Réponse 429 explicite si rate limit dépassé
FR21: Epic 1 — Persistance des données (survit aux redémarrages)
FR22: Epic 2 — Palette de couleurs pastel
FR23: Epic 2 — Motifs géométriques en arrière-plan
FR24: Epic 2 — Badge "Made with AI"
FR25: Epic 2 — Grille plein écran sur mobile pendant la partie
FR26: Epic 2 — Grille + leaderboard visibles simultanément sur desktop
FR27: Epic 4 — URL publique avec HTTPS
FR28: Epic 4 — CORS restreint à l'origine frontend
FR29: Epic 4 — Secrets gérés via variables d'environnement
FR30: Epic 4 — Déploiement automatique depuis push Git

## Epic List

### Epic 1 : Fondation du projet & Backend API
Thomas dispose d'un backend fonctionnel et testable localement — structure de fichiers, couche données, endpoints REST avec validation Pydantic, rate limiting SlowAPI et persistance SQLAlchemy (SQLite dev / PostgreSQL prod).
**FRs couverts :** FR16, FR17, FR18, FR19, FR20, FR21

### Epic 2 : Interface de Jeu 2048
Le joueur peut jouer une partie complète de 2048 avec l'interface pastel soignée — sur desktop (clavier) et mobile (swipe) — sans aucun backend nécessaire.
**FRs couverts :** FR1, FR2, FR3, FR4, FR5, FR6, FR22, FR23, FR24, FR25, FR26
**UX-DRs couverts :** UX-DR1, UX-DR2, UX-DR3, UX-DR4, UX-DR8, UX-DR9, UX-DR10, UX-DR13, UX-DR14, UX-DR15

### Epic 3 : Soumission de Score & Leaderboard
Le joueur peut, en fin de partie, saisir son pseudo, soumettre son score, voir son rang dans le Top 10 et rejouer — avec gestion d'erreur gracieuse (retry + rejouer).
**FRs couverts :** FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15
**UX-DRs couverts :** UX-DR5, UX-DR6, UX-DR7, UX-DR11, UX-DR12

### Epic 4 : Déploiement & Sécurité Production
L'application est en ligne sur Render.com — HTTPS, CORS restreint à l'origine frontend, secrets en variables d'environnement, déploiement automatique depuis un push Git.
**FRs couverts :** FR27, FR28, FR29, FR30

---

## Epic 1 : Fondation du projet & Backend API

L'agent de développement peut initialiser le projet, mettre en place la couche données et exposer une API REST fonctionnelle et testable localement.

### Story 1.1 : Initialisation de la structure du projet

En tant qu'agent de développement,
je veux créer la structure complète de fichiers et dossiers du projet,
afin que le projet soit prêt à recevoir l'implémentation du backend et du frontend.

**Acceptance Criteria:**

**Given** un répertoire de projet vide
**When** la structure est initialisée
**Then** les dossiers `frontend/` et `backend/` existent
**And** les fichiers `frontend/index.html`, `frontend/style.css`, `frontend/app.js` sont créés (vides)
**And** les fichiers `backend/main.py`, `backend/models.py`, `backend/database.py`, `backend/schemas.py` sont créés (vides)
**And** `backend/requirements.txt` contient : `fastapi`, `uvicorn[standard]`, `sqlalchemy`, `psycopg2-binary`, `python-dotenv`, `slowapi`
**And** `backend/.env.example` contient les clés `DATABASE_URL` et `FRONTEND_ORIGIN` avec des valeurs d'exemple
**And** `render.yaml` est créé (vide, prêt pour Epic 4)
**And** `README.md` est créé avec le nom du projet
**And** `.gitignore` couvre : `__pycache__/`, `*.pyc`, `.env`, `*.db`, `.DS_Store`

---

### Story 1.2 : Couche données — connexion DB et modèle Score

En tant qu'agent de développement,
je veux implémenter la connexion à la base de données et le modèle SQLAlchemy,
afin que les scores puissent être persistés indifféremment en SQLite (dev) ou PostgreSQL (prod).

**Acceptance Criteria:**

**Given** un fichier `.env` local avec `DATABASE_URL=sqlite:///./scores.db`
**When** l'application démarre
**Then** la connexion à la base de données est établie sans erreur
**And** la table `scores` est créée automatiquement si elle n'existe pas (`CREATE TABLE IF NOT EXISTS`)
**And** la table possède les colonnes : `id` (PK autoincrement), `pseudo` (VARCHAR 20, default 'Anonyme'), `score` (INTEGER NOT NULL, CHECK > 0), `created_at` (TIMESTAMP, default now)

**Given** une variable `DATABASE_URL` pointant vers une URL PostgreSQL
**When** l'application démarre
**Then** la connexion s'établit avec PostgreSQL sans modification du code métier

**Given** le module `database.py`
**When** il est importé
**Then** il expose un moteur SQLAlchemy, une `SessionLocal` et une fonction `create_tables()`

---

### Story 1.3 : API FastAPI — endpoints, validation et rate limiting

En tant qu'agent de développement,
je veux implémenter l'application FastAPI avec ses deux endpoints, la validation Pydantic et le rate limiting SlowAPI,
afin que l'API soit fonctionnelle et testable via `/docs`.

**Acceptance Criteria:**

**Given** l'API en cours d'exécution (`uvicorn backend.main:app --reload`)
**When** `POST /scores` est appelé avec `{"pseudo": "Léa", "score": 4096}`
**Then** la réponse est `200` avec `{"id": <int>, "rank": <int>}`
**And** le score est persisté en base de données

**Given** l'API en cours d'exécution
**When** `POST /scores` est appelé avec `{"score": 4096}` (pseudo absent)
**Then** la réponse est `200` et le pseudo est stocké comme `"Anonyme"`

**Given** l'API en cours d'exécution
**When** `POST /scores` est appelé avec `{"score": -1}` ou `{"score": 0}`
**Then** la réponse est `422` avec un message d'erreur Pydantic standard

**Given** l'API en cours d'exécution
**When** `POST /scores` est appelé avec `{"pseudo": "UnPseudoTropLong21chars", "score": 100}`
**Then** la réponse est `422` (pseudo dépasse 20 caractères)

**Given** la même IP effectue 11 appels `POST /scores` en moins d'une minute
**When** le 11e appel arrive
**Then** la réponse est `429` avec `{"detail": "Rate limit exceeded. Try again later."}`

**Given** l'API en cours d'exécution
**When** `GET /scores/top10` est appelé
**Then** la réponse est `200` avec un tableau JSON d'au plus 10 entrées
**And** chaque entrée contient `pseudo` (string), `score` (int), `created_at` (ISO 8601)
**And** les entrées sont triées par score décroissant

**Given** la base contient 3 scores : 8000, 5000, 2000
**When** `POST /scores` est appelé avec `{"pseudo": "Karim", "score": 3000}`
**Then** la réponse contient `{"id": <int>, "rank": 3}`
**And** le rang reflète la position exacte dans le classement global (scores supérieurs + 1)

**Given** la base est vide
**When** `POST /scores` est appelé avec n'importe quel score valide
**Then** la réponse contient `"rank": 1`

**Given** l'API en cours d'exécution
**When** la documentation est consultée à `/docs`
**Then** les deux endpoints sont visibles et testables

---

## Epic 2 : Interface de Jeu 2048

Le joueur peut jouer une partie complète de 2048 avec l'interface pastel soignée — sur desktop (clavier) et mobile (swipe) — sans aucun backend nécessaire.

### Story 2.1 : Structure HTML & design system CSS

En tant qu'agent de développement,
je veux implémenter la structure HTML sémantique et le design system CSS complet,
afin que la page soit visuellement conforme aux spécifications UX et responsive dès le premier rendu.

**Acceptance Criteria:**

**Given** le fichier `index.html` ouvert dans un navigateur moderne
**When** la page se charge
**Then** la structure sémantique est présente : `<main>`, `<section>` pour la grille, `<section>` pour le leaderboard, `<h1>` avec le titre du jeu
**And** le badge "Made with AI ✨" est visible dans un coin fixe de l'interface (`aria-hidden="true"`)
**And** le fond de page est de couleur `#F5F0EB` avec un motif géométrique CSS (pas d'`<img>` décoratif)

**Given** la feuille de style `style.css` chargée
**When** les variables CSS sont inspectées
**Then** toutes les variables de la palette sont définies en `:root` : `--color-bg`, `--color-surface`, `--color-grid-bg`, `--color-cell-empty`, `--color-primary`, `--color-success`, `--color-text`, `--color-text-light`
**And** les couleurs de tuiles sont définies par palier : `--color-tile-2` à `--color-tile-2048` (au moins 11 paliers)

**Given** un viewport de largeur ≥ 768px (desktop)
**When** la page est affichée
**Then** le layout est en 2 colonnes (grille ~60%, leaderboard ~40%) via Flexbox
**And** le max-width est `960px`, centré horizontalement avec `padding: 32px`

**Given** un viewport de largeur < 768px (mobile)
**When** la page est affichée
**Then** le layout est en 1 colonne, la grille occupe toute la largeur
**And** la section leaderboard est masquée (`display: none`)

**Given** la feuille de style chargée
**When** les boutons sont rendus
**Then** le bouton Primary a un fond `#8B7BA8`, texte blanc, `border-radius: 10px`
**And** le bouton Secondary a un fond `#F5F0EB`, texte `#3D3540`, même shape
**And** tous les éléments focusables ont un outline `2px solid #8B7BA8`

---

### Story 2.2 : Moteur de jeu 2048 — logique et rendu

En tant qu'agent de développement,
je veux implémenter la logique complète du jeu 2048 et le rendu de la grille dans le DOM,
afin que le joueur puisse jouer une partie de bout en bout.

**Acceptance Criteria:**

**Given** la page chargée
**When** elle s'affiche pour la première fois
**Then** la grille 4×4 est rendue avec 2 tuiles initiales placées aléatoirement
**And** le score affiché est `0`
**And** aucune action préalable n'est requise pour commencer à jouer (FR1)

**Given** une grille avec des tuiles
**When** un déplacement est déclenché (haut/bas/gauche/droite)
**Then** toutes les tuiles glissent dans la direction avec une animation CSS (`transition: transform 80ms ease-out`)
**And** les tuiles de même valeur adjacentes dans la direction fusionnent en une tuile de valeur double
**And** une nouvelle tuile (valeur 2 ou 4) apparaît aléatoirement dans une cellule vide après chaque mouvement valide

**Given** deux tuiles de valeurs différentes adjacentes dans la direction du déplacement (ex. tuile `2` et tuile `4`)
**When** un déplacement est déclenché dans cette direction
**Then** les deux tuiles glissent sans fusionner
**And** elles se retrouvent côte à côte (ou bloquées par un bord/une autre tuile) sans aucune modification de leur valeur

**Given** une fusion de deux tuiles
**When** la fusion se produit
**Then** la tuile résultante a un flash visuel CSS (scale 1.1 → 1.0)
**And** la couleur de la tuile correspond au palier de valeur (`--color-tile-<valeur>`)

**Given** une grille en cours de partie
**When** le score augmente suite à une fusion
**Then** le score courant est mis à jour immédiatement dans le DOM (FR5)
**And** une micro-animation "+N" apparaît et disparaît au-dessus du ScoreBox

**Given** le meilleur score en localStorage
**When** la page se charge
**Then** le meilleur score est restauré et affiché dans le ScoreBox "Meilleur"
**And** si le score courant dépasse le meilleur score, le meilleur score est mis à jour en temps réel

**Given** une grille où aucun mouvement n'est possible
**When** le joueur tente un déplacement (ou automatiquement après le dernier coup)
**Then** la fin de partie est détectée (FR4)
**And** l'état `gameOver: true` est positionné dans `state`
**And** tout déplacement ultérieur est ignoré (le jeu est gelé)
**And** l'élément `#game-over-modal` est rendu visible dans le DOM avec le score final affiché
**And** les boutons de soumission de score et de reprise de partie seront ajoutés en Story 3.2

---

### Story 2.3 : Contrôles clavier, swipe et bouton Rejouer

En tant qu'agent de développement,
je veux implémenter les contrôles clavier (desktop), swipe tactile (mobile) et le bouton Rejouer,
afin que le joueur puisse interagir avec le jeu sur toutes les plateformes cibles.

**Acceptance Criteria:**

**Given** un utilisateur sur desktop
**When** il appuie sur une touche directionnelle (ArrowUp, ArrowDown, ArrowLeft, ArrowRight)
**Then** le déplacement correspondant est déclenché dans le moteur de jeu (FR2)
**And** la réponse est perceptible en < 100ms

**Given** un utilisateur sur mobile
**When** il effectue un swipe (touchstart → touchend avec delta X ou Y > 30px)
**Then** la direction du swipe est correctement détectée (haut/bas/gauche/droite) (FR3)
**And** le déplacement correspondant est déclenché dans le moteur de jeu

**Given** un swipe diagonal ou un micro-tap (delta < 30px)
**When** le geste est détecté
**Then** aucun déplacement n'est déclenché (évite les faux positifs)

**Given** une partie en cours ou terminée
**When** le joueur clique sur le bouton "Rejouer"
**Then** la grille est réinitialisée à 2 tuiles aléatoires (FR6)
**And** le score courant est remis à `0`
**And** `gameOver` est remis à `false`
**And** le meilleur score en localStorage est conservé

**Given** un état `gameOver: true`
**When** le joueur appuie sur une touche directionnelle ou swipe
**Then** aucun déplacement n'est déclenché (le jeu est gelé jusqu'au "Rejouer")

---

## Epic 3 : Soumission de Score & Leaderboard

Le joueur peut, en fin de partie, saisir son pseudo, soumettre son score, voir son rang dans le Top 10 et rejouer — avec gestion d'erreur gracieuse (retry + rejouer).

### Story 3.1 : Chargement initial du leaderboard

En tant qu'agent de développement,
je veux implémenter le chargement et l'affichage du leaderboard Top 10 au démarrage,
afin que le joueur desktop voie immédiatement le classement à son arrivée sur la page.

**Acceptance Criteria:**

**Given** la page chargée sur un viewport desktop (≥ 768px)
**When** `GET /scores/top10` est en cours de chargement
**Then** le leaderboard affiche 3 barres skeleton animées (placeholder de chargement)

**Given** la réponse de `GET /scores/top10` est reçue avec des entrées
**When** le leaderboard est rendu
**Then** jusqu'à 10 entrées sont affichées, triées par score décroissant (FR12)
**And** chaque ligne affiche : le rang (médaille 🥇🥈🥉 pour le top 3), le pseudo, le score et la date formatée (FR15)

**Given** la réponse de `GET /scores/top10` est reçue vide (aucun score en base)
**When** le leaderboard est rendu
**Then** un message "Sois le premier !" est affiché à la place de la liste

**Given** `GET /scores/top10` retourne une erreur réseau ou un statut non-200
**When** l'erreur est reçue
**Then** un message discret "Classement indisponible" est affiché
**And** le jeu reste entièrement jouable (l'erreur leaderboard ne bloque pas la partie)

**Given** la page chargée sur un viewport mobile (< 768px)
**When** la page s'affiche
**Then** le leaderboard est masqué (`display: none`) pendant la partie (FR13)
**And** `GET /scores/top10` est tout de même appelé en arrière-plan pour préparer les données

---

### Story 3.2 : Modale fin de partie, soumission et affichage du rang

En tant qu'agent de développement,
je veux implémenter la `GameOverModal` avec la soumission de score et l'affichage du rang,
afin que le joueur puisse enregistrer son score, découvrir sa position et rejouer sans friction.

**Acceptance Criteria:**

**Given** l'état `gameOver: true` déclenché par le moteur de jeu
**When** la modale s'ouvre
**Then** elle apparaît avec une animation `scale(0.95 → 1)` + `opacity(0 → 1)` en 150ms
**And** elle affiche le score final de la partie
**And** un champ texte avec placeholder `"Ton pseudo (optionnel)"` est présent
**And** un bouton "Enregistrer mon score" (Primary) et un bouton "Rejouer" (Secondary) sont visibles
**And** le focus est piégé dans la modale (focus trap actif) (FR7)

**Given** la modale ouverte
**When** le joueur clique sur "Enregistrer mon score" (avec ou sans pseudo)
**Then** le bouton est désactivé et son texte change en "Enregistrement…" (FR8)
**And** `POST /scores` est appelé avec `{ pseudo, score }`

**Given** `POST /scores` appelé avec un champ pseudo vide
**When** la requête est envoyée
**Then** le pseudo est transmis comme `null` et le backend le stocke comme `"Anonyme"` (FR9)

**Given** `POST /scores` retourne `200` avec `{ id, rank }`
**When** la réponse est reçue
**Then** le rang du joueur est affiché dans la modale ("Tu es classé N° X !")
**And** `GET /scores/top10` est rappelé et le leaderboard est mis à jour (FR14)
**And** la nouvelle entrée du joueur est highlightée dans le leaderboard
**And** sur mobile, le leaderboard devient visible (FR13)

**Given** `POST /scores` retourne une erreur (réseau, 429, 5xx)
**When** l'erreur est reçue
**Then** le bouton "Enregistrer" est réactivé
**And** un message d'erreur inline s'affiche dans la modale : icône ⚠️ + texte rouge doux `#E87070` + "Oups, impossible d'enregistrer ton score." (FR10)
**And** un bouton "Réessayer" est affiché

**Given** le message d'erreur et le bouton "Réessayer" affichés
**When** le joueur clique sur "Réessayer"
**Then** `POST /scores` est rappelé avec les mêmes données (pseudo + score conservés) (FR11)

**Given** la modale ouverte (succès ou erreur)
**When** le joueur clique sur "Rejouer"
**Then** la modale se ferme
**And** une nouvelle partie démarre immédiatement (grille réinitialisée, score à 0)
**And** sur mobile, le leaderboard est de nouveau masqué

**Given** la modale ouverte
**When** le joueur appuie sur `Enter` avec le champ pseudo focalisé
**Then** la soumission est déclenchée (équivalent au clic sur "Enregistrer")

---

## Epic 4 : Déploiement & Sécurité Production

L'application est en ligne sur Render.com — HTTPS, CORS restreint à l'origine frontend, secrets en variables d'environnement, déploiement automatique depuis un push Git.

### Story 4.1 : Configuration du déploiement Render.com

En tant qu'agent de développement,
je veux configurer `render.yaml` et préparer le projet pour le déploiement sur Render.com,
afin que l'application soit accessible via une URL publique HTTPS avec déploiement automatique depuis Git.

**Acceptance Criteria:**

**Given** le fichier `render.yaml` à la racine du projet
**When** il est inspecté
**Then** il définit un service web de type `python` nommé `test-bmad`
**And** le `buildCommand` est `pip install -r backend/requirements.txt`
**And** le `startCommand` est `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
**And** la variable `DATABASE_URL` est liée à la base PostgreSQL `test-bmad-db` via `fromDatabase`
**And** la variable `FRONTEND_ORIGIN` est définie avec l'URL Render attendue
**And** une base de données PostgreSQL `test-bmad-db` (plan free) est déclarée

**Given** `main.py`
**When** il est inspecté
**Then** FastAPI sert les fichiers statiques du dossier `frontend/` via `StaticFiles` monté sur `/`
**And** les routes API (`/scores`, `/scores/top10`) sont déclarées avant le mount `StaticFiles` pour avoir la priorité

**Given** un push Git sur la branche principale
**When** Render.com détecte le push
**Then** le build se déclenche automatiquement (FR30)
**And** le service démarre avec `uvicorn` sans erreur

**Given** le service démarré sur Render.com
**When** l'URL publique est visitée
**Then** la page est accessible via HTTPS (FR27)
**And** le certificat SSL est valide (géré automatiquement par Render.com)

---

### Story 4.2 : Sécurité production — CORS et validation end-to-end

En tant qu'agent de développement,
je veux configurer le CORS avec la variable d'environnement `FRONTEND_ORIGIN` et valider le bon fonctionnement de l'application en production,
afin que le backend n'accepte que les requêtes légitimes et que l'expérience joueur soit vérifiée de bout en bout.

**Acceptance Criteria:**

**Given** `main.py` avec le middleware CORS configuré
**When** il est inspecté
**Then** `allow_origins` est défini exclusivement depuis la variable d'environnement `FRONTEND_ORIGIN` (FR28)
**And** aucune valeur d'origine n'est hardcodée dans le code

**Given** une requête `POST /scores` provenant de l'origine `FRONTEND_ORIGIN` en production
**When** la requête arrive au backend
**Then** la réponse inclut les headers CORS appropriés et la requête aboutit

**Given** une requête `POST /scores` provenant d'une origine non autorisée
**When** la requête arrive au backend
**Then** la réponse est bloquée par le middleware CORS (pas de headers CORS dans la réponse)

**Given** l'application déployée en production
**When** une vérification end-to-end est effectuée
**Then** la page se charge en moins de 2 secondes (NFR1)
**And** une partie complète est jouable sur desktop (clavier)
**And** une partie complète est jouable sur mobile (swipe)
**And** la soumission d'un score de test fonctionne et retourne un rang
**And** le leaderboard se met à jour après la soumission
**And** les headers HTTP confirment HTTPS actif sur toutes les réponses

**Given** les variables d'environnement sur Render.com
**When** elles sont inspectées dans le dashboard
**Then** `DATABASE_URL` et `FRONTEND_ORIGIN` sont définies sans être exposées dans le code source (FR29)
