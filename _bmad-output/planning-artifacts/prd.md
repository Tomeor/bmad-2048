---
stepsCompleted: ["step-01-init", "step-02-discovery", "step-02b-vision", "step-02c-executive-summary", "step-03-success", "step-04-journeys", "step-05-domain", "step-06-innovation", "step-07-project-type", "step-08-scoping", "step-09-functional", "step-10-nonfunctional", "step-11-polish", "step-12-complete"]
status: "complete"
completedAt: "2026-03-14"
classification:
  projectType: "web_app+api_backend"
  domain: "general"
  complexity: "low"
  projectContext: "greenfield"
inputDocuments: ["product-brief-test-bmad-2026-03-14.md"]
workflowType: 'prd'
---

# Product Requirements Document - test-bmad

**Author:** Thomas
**Date:** 2026-03-14
**Type :** Web app (SPA vanilla) + API backend (Python/FastAPI) — Greenfield — Complexité faible

---

## Executive Summary

**test-bmad** est un jeu 2048 en ligne au design pastel soigné, accompagné d'un leaderboard public. Construit de A à Z par Thomas en collaboration avec l'IA — frontend HTML/CSS/JS vanilla, backend Python (FastAPI), stockage persistant, déploiement cloud gratuit (Render.com).

**Deux audiences :**
- **Thomas** — développeur-apprenant qui utilise ce projet pour maîtriser la collaboration humain-IA sur l'ensemble du cycle de développement (conception → code → déploiement → sécurité)
- **Le joueur anonyme** — reçoit un lien, joue sans inscription, soumet son score, voit son rang

### What Makes This Special

Pour le joueur : zéro friction, interface esthétiquement ambitieuse (palette pastel, motifs géométriques, badge "Made with AI"), satisfaction immédiate du leaderboard. Pour Thomas : le vrai livrable n'est pas le jeu — c'est la méthode de travail acquise, reproductible sur n'importe quel prochain projet. Ce projet répond à un besoin concret : entrer dans l'ère du développement IA-assisté par la pratique, pas la théorie.

---

## Success Criteria

### User Success

- Le joueur arrive sur la page et peut commencer à jouer en moins de 2 secondes (chargement initial)
- La partie se joue sans bug bloquant du premier au dernier coup
- La soumission du score fonctionne du premier essai — le joueur voit son rang immédiatement après
- L'expérience est fluide sur desktop et mobile, sans inscription requise

### Business Success

Projet d'apprentissage personnel — pas d'objectif commercial. Succès mesuré à l'expérience de Thomas :
- Projet terminé de bout en bout (conception → code → déploiement → en ligne)
- Thomas a vécu le process complet de collaboration humain-IA, applicable à un prochain projet
- Thomas sait déployer une application web avec backend sur infrastructure cloud gratuite

### Technical Success

- Site accessible via URL publique (HTTPS)
- CORS configuré, entrées validées côté backend, rate limiting actif
- Chargement initial < 2 secondes
- Données du leaderboard persistantes entre redémarrages
- Jouable sur mobile — design responsive et contrôles swipe

### Measurable Outcomes

| Critère | Cible |
|---|---|
| Chargement initial | < 2s |
| Jeu jouable de bout en bout | ✅ Oui |
| Score soumis et visible dans le leaderboard | ✅ Oui |
| Site déployé en production avec URL publique | ✅ Oui |
| Interface pastel + motifs géométriques + badge IA | ✅ Oui |
| Jouable sur mobile (swipe + responsive) | ✅ Oui |
| Process collaboration IA vécu de A à Z | ✅ Oui |

---

## Product Scope

### MVP - Minimum Viable Product

**Approche :** Experience MVP — livrer une expérience joueur complète et soignée en une seule itération.
**Ressources :** Thomas (1 développeur) + IA comme pair de développement

1. **Jeu 2048** — jouable sur desktop (clavier) et mobile (swipe), sans inscription
2. **Interface soignée** — palette pastel, motifs géométriques en fond, badge "Made with AI"
3. **Soumission de score** — modale fin de partie, pseudo optionnel, bouton "Rejouer"
4. **Leaderboard public** — Top 10 (desktop : dès l'arrivée ; mobile : après la partie)
5. **Backend Python** — API FastAPI : `POST /scores` + `GET /scores/top10`
6. **Stockage persistant** — SQLite ou PostgreSQL, persistance entre redémarrages
7. **Déploiement sécurisé** — HTTPS, CORS, validation des entrées, rate limiting, Render.com

### Post-MVP

N/A — projet d'apprentissage ponctuel, aucune roadmap prévue.

### Risk Mitigation

- **Risque déploiement** (CORS, DB persistante sur Render) — tester localement avant push ; SQLite en fallback si PostgreSQL pose problème
- **Risque ressources** (Thomas seul) — prioriser la fonctionnalité sur le polish si le temps manque

---

## User Journeys

### Parcours 1 — Joueur Anonyme (Desktop, succès)

*Léa reçoit un message de Thomas : "J'ai fait un truc, viens voir." Elle clique sur le lien.*

**Découverte :** La page s'ouvre en moins de 2 secondes. Grille 2048 sur fond géométrique pastel et leaderboard Top 10 visibles simultanément. Badge "Made with AI ✨". Pas de popup, pas d'inscription.

**Jeu :** Touches directionnelles. Tuiles fluides. Elle atteint 4096.

**Climax :** Fin de partie. Modale : score + champ "Ton pseudo ?". Elle tape "Léa" et valide.

**Résolution :** Leaderboard mis à jour — Léa en 3e position. Bouton "Rejouer" → nouvelle partie immédiate.

---

### Parcours 2 — Joueur Anonyme (Mobile, succès)

*Karim est dans le métro. Lien reçu sur WhatsApp, ouvert sur iPhone 13.*

**Découverte :** La grille occupe tout l'écran — pas de leaderboard visible, pas de distraction. Design pastel propre sur petit écran.

**Jeu :** Swipes. Haut, droite, bas — tuiles répondent instantanément.

**Climax :** Game over. Score + champ pseudo. Il tape "Karim" et soumet.

**Résolution :** Leaderboard apparaît — il est 7e. Bouton "Rejouer" disponible.

---

### Parcours 3 — Joueur Anonyme (Edge cases)

**Cas A — Sans pseudo :** Marc laisse le champ vide et valide. Score soumis sous "Anonyme". Leaderboard mis à jour normalement. Bouton "Rejouer" affiché.

**Cas B — Erreur backend :** Sofia soumet. Backend indisponible. Message : "Oups, impossible d'enregistrer ton score. Réessaie ?" + bouton Réessayer. Bouton "Rejouer" également disponible.

---

### Parcours 4 — Thomas (Déploiement & Opérations)

*Thomas pousse le code sur Git après l'implémentation.*

**Déploiement :** Render.com détecte le push, build automatique, service démarré. Thomas surveille les logs.

**Vérification :** Partie rapide desktop puis mobile. Soumission score test. Leaderboard vérifié. Headers HTTP inspectés — HTTPS actif, CORS correct.

**Résolution :** Tout fonctionne. Lien envoyé à Léa et Karim. Projet réel, en ligne, fait de A à Z avec l'IA.

---

### Journey Requirements Summary

| Capacité requise | Révélée par |
|---|---|
| Chargement < 2s, aucune friction d'accueil | Parcours 1 & 2 |
| Layout adaptatif desktop/mobile | Parcours 2 |
| Grille plein écran sur mobile, leaderboard post-partie | Parcours 2 |
| Contrôles clavier (desktop) + swipe (mobile) | Parcours 1 & 2 |
| Modale fin de partie avec champ pseudo | Parcours 1, 2 & 3 |
| Soumission anonyme si pseudo vide | Parcours 3A |
| Message d'erreur clair + bouton Réessayer | Parcours 3B |
| Bouton "Rejouer" après fin de partie (succès ou erreur) | Parcours 1, 2 & 3 |
| Déploiement Git automatisé (Render.com) | Parcours 4 |
| Logs accessibles, HTTPS + CORS vérifiables | Parcours 4 |

---

## Technical Requirements

### Architecture

- **Frontend** : SPA statique — HTML + CSS + JS vanilla, servi statiquement (pas de build step, pas de framework)
- **Backend** : FastAPI (Python), deux endpoints JSON
- **Communication** : Fetch API (JS natif) → backend, réponses JSON
- **Déploiement** : Frontend et backend déployables séparément ou ensemble sur Render.com

### Browser Support

Navigateurs modernes uniquement : Chrome, Firefox, Safari, Edge (2 dernières années majeures). Pas de support legacy.

### Responsive Design

- Desktop : grille + leaderboard visibles simultanément
- Mobile : grille plein écran pendant la partie ; leaderboard affiché uniquement après la fin de partie

### Endpoint Specifications

| Méthode | Endpoint | Corps / Réponse |
|---|---|---|
| `POST` | `/scores` | `{"pseudo": "string?", "score": int}` |
| `GET` | `/scores/top10` | `[{"pseudo": "string", "score": int, "created_at": "datetime"}]` |

### Auth Model

API publique — aucune authentification. Validation côté backend : pseudo max 20 chars (optionnel), score entier positif obligatoire.

### Implementation Constraints

- CORS restreint à l'origine frontend (variable d'environnement)
- Secrets de configuration (DB connection string) gérés via variables d'environnement
- Validation et sanitisation des entrées avant toute insertion en base

---

## Functional Requirements

### Moteur de Jeu

- **FR1 :** Le joueur peut démarrer une partie de 2048 sans inscription ni action préalable
- **FR2 :** Le joueur peut déplacer les tuiles avec les touches directionnelles (desktop)
- **FR3 :** Le joueur peut déplacer les tuiles avec des gestes de swipe (mobile)
- **FR4 :** Le système détecte automatiquement la fin de partie (aucun mouvement possible)
- **FR5 :** Le joueur voit son score mis à jour en temps réel pendant la partie
- **FR6 :** Le joueur peut relancer une nouvelle partie à tout moment via un bouton "Rejouer"

### Soumission de Score

- **FR7 :** Le joueur peut saisir un pseudo (optionnel) à la fin de la partie
- **FR8 :** Le joueur peut soumettre son score avec ou sans pseudo
- **FR9 :** Le système soumet le score sous le label "Anonyme" si aucun pseudo n'est fourni
- **FR10 :** Le système affiche un message d'erreur clair si la soumission échoue
- **FR11 :** Le joueur peut réessayer la soumission en cas d'échec, sans perdre son score

### Leaderboard

- **FR12 :** Le joueur (desktop) voit le Top 10 des scores dès l'arrivée sur la page
- **FR13 :** Le joueur (mobile) voit le Top 10 uniquement après la fin de partie
- **FR14 :** Le leaderboard se met à jour après chaque soumission réussie
- **FR15 :** Le leaderboard affiche pour chaque entrée : pseudo, score et date

### API Backend

- **FR16 :** Le système expose un endpoint pour soumettre un score (pseudo + valeur entière)
- **FR17 :** Le système expose un endpoint pour récupérer le Top 10 des scores
- **FR18 :** Le système valide les données entrantes (pseudo max 20 chars, score entier positif)
- **FR19 :** Le système limite les soumissions à 10 par IP par minute
- **FR20 :** Le système retourne une réponse d'erreur explicite en cas de dépassement du rate limit
- **FR21 :** Le système stocke chaque soumission de manière persistante (survit aux redémarrages)

### Interface & Design

- **FR22 :** L'interface utilise une palette de couleurs pastel
- **FR23 :** L'interface affiche des motifs géométriques en arrière-plan
- **FR24 :** L'interface affiche un badge "Made with AI"
- **FR25 :** Sur mobile, la grille occupe la totalité de l'écran pendant la partie
- **FR26 :** Sur desktop, la grille et le leaderboard sont visibles simultanément

### Déploiement & Sécurité

- **FR27 :** Le site est accessible via une URL publique avec HTTPS
- **FR28 :** Le backend autorise uniquement les requêtes provenant de l'origine du frontend (CORS)
- **FR29 :** Les secrets de configuration sont gérés via variables d'environnement
- **FR30 :** Le déploiement se déclenche automatiquement depuis un push Git

---

## Non-Functional Requirements

### Performance

- Chargement initial (HTML + CSS + JS + données leaderboard) < 2 secondes sur connexion standard
- Actions de jeu (déplacement de tuiles) traitées localement en < 100ms
- Appels API (`POST /scores`, `GET /scores/top10`) répondent en < 1 seconde en conditions normales

### Security

- Toutes les communications frontend ↔ backend via HTTPS
- CORS restreint à l'origine frontend déclarée en variable d'environnement
- Entrées (pseudo, score) validées et sanitisées côté backend avant tout traitement
- Soumissions limitées à 10 par IP par minute — réponse `429` si dépassé
- Aucune donnée sensible (mot de passe, email, paiement) collectée ou stockée

### Accessibility

- Contraste suffisant sur fond pastel (lisibilité visuelle)
- Jeu utilisable au clavier sur desktop (touches directionnelles) et tactile sur mobile (swipe)
