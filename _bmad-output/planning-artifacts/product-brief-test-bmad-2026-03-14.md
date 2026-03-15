---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments: []
date: 2026-03-14
author: Thomas
---

# Product Brief: test-bmad

## Executive Summary

**test-bmad** est un projet d'apprentissage centré sur la collaboration humain-IA pour le développement logiciel. Il prend la forme d'un jeu 2048 jouable en ligne par le grand public, accompagné d'un leaderboard simple permettant aux joueurs de soumettre leur score avec leur nom. Le projet est conçu pour être réalisé en quelques heures, déployé sur une infrastructure gratuite, et servir de terrain d'expérimentation concret pour maîtriser les workflows de développement assisté par IA.

---

## Core Vision

### Problem Statement

Un développeur expérimenté (profil C, notions Python) souhaite acquérir de la compétence sur l'utilisation de l'IA comme outil de développement, mais manque d'un projet concret, rapide à réaliser et suffisamment complet pour couvrir les différentes dimensions du dev (front, back, base de données, déploiement, sécurité).

### Problem Impact

Sans projet réel à portée de main, l'apprentissage reste théorique. Les tutoriels existants sur l'IA pour le dev sont soit trop abstraits, soit trop complexes pour être réalisés rapidement avec un résultat tangible.

### Why Existing Solutions Fall Short

Les projets d'exemple classiques sont soit trop triviaux (pas de back, pas de déploiement), soit trop complexes pour être maîtrisés en quelques heures. Ils ne permettent pas de vivre l'expérience complète de collaboration avec l'IA de bout en bout.

### Proposed Solution

Un jeu 2048 en ligne avec :
- **Frontend** : HTML/CSS/JS vanilla (simple, sans framework, facile à générer avec l'IA)
- **Backend** : Python avec FastAPI ou Flask (cohérent avec le profil Python de Thomas, hébergeable gratuitement)
- **Stockage** : SQLite ou PostgreSQL sur tier gratuit (ex : Render.com)
- **Déploiement** : Render.com ou Railway — hébergement gratuit, déploiement automatisé depuis Git, géré par l'IA avec sécurité assurée (HTTPS, CORS, validation des entrées)
- **Timeline** : Quelques heures, bout en bout

### Key Differentiators

Ce projet est unique car son vrai livrable n'est pas le jeu — c'est **la compétence acquise** en pilotant l'IA sur l'ensemble du cycle : analyse, architecture, implémentation, déploiement, sécurité. Chaque décision technique est une occasion d'apprendre à collaborer efficacement avec l'IA.

---

## Target Users

### Primary Users

**Thomas — Le Développeur-Apprenant**
Ancien développeur C avec quelques notions Python, Thomas utilise ce projet comme terrain d'entraînement pour maîtriser la collaboration avec l'IA dans un cycle de développement complet (conception, code, déploiement, sécurité). Le jeu lui-même est secondaire : c'est le processus qui compte.

- **Objectif** : Acquérir une méthode de travail avec l'IA, de A à Z
- **Succès** : Un projet fonctionnel en ligne, réalisé en quelques heures, dont il comprend chaque décision technique
- **Interaction principale** : Concepteur, pilote de l'IA, testeur

**Le Joueur Anonyme — "Un ami qu'on envoie jouer"**
Toute personne recevant un lien, sans compte requis, sans friction. Il arrive, il voit le leaderboard et une grille prête. Il joue, il soumet son pseudo à la fin, il voit son rang. Simple, immédiat, fun.

- **Motivation** : Se divertir, se comparer aux autres
- **Profil type** : Curieux, occasionnel, pas forcément gamer
- **Friction acceptable** : Zéro — tout doit marcher en quelques secondes

### Secondary Users

Aucun utilisateur secondaire identifié (pas d'admin, pas de modération prévue dans cette version).

### User Journey

**Parcours du Joueur Anonyme :**

1. **Découverte** : Reçoit un lien (message, réseaux sociaux)
2. **Arrivée** : Voit immédiatement le leaderboard + la grille de jeu — aucune inscription, aucun écran de bienvenue superflu
3. **Jeu** : Joue au 2048 directement dans le navigateur
4. **Fin de partie** : Score affiché, invite à entrer son pseudo
5. **Soumission** : Entre son pseudo, score envoyé au backend
6. **Récompense** : Voit son rang dans le classement général — moment "aha !"
7. **Retention** : Peut rejouer immédiatement pour battre son score

---

## Success Metrics

Le succès de **test-bmad** se mesure principalement à l'expérience d'apprentissage de Thomas, et secondairement à la qualité du livrable.

**Critère de succès principal :**
Le projet est déployé en ligne, fonctionnel et accessible publiquement — réalisé de bout en bout par l'IA sous la direction de Thomas, en quelques heures.

**Critères de succès secondaires :**
- Thomas comprend chaque décision prise (stack, déploiement, sécurité) parce que l'IA l'a expliquée au fur et à mesure
- Thomas est capable de reproduire une démarche similaire sur un prochain projet de façon autonome

### Business Objectives

N/A — projet d'apprentissage personnel, sans objectif commercial.

### Key Performance Indicators

| KPI | Cible | Mesure |
|---|---|---|
| Site déployé et accessible | ✅ Oui | URL fonctionnelle en production |
| Jeu 2048 jouable | ✅ Oui | Partie complète jouable dans le navigateur |
| Leaderboard fonctionnel | ✅ Oui | Score soumis et visible dans le classement |
| Guidage IA satisfaisant | ✅ Oui | Thomas comprend ce qui a été fait et pourquoi |

---

## MVP Scope

### Core Features

1. **Jeu 2048** — implémentation complète dans le navigateur (HTML/CSS/JS vanilla), jouable sans inscription
2. **Soumission de score** — à la fin de partie, le joueur saisit son pseudo et son score est envoyé au backend
3. **Leaderboard public** — affichage du Top 10 des meilleurs scores, visible sur la page principale dès l'arrivée
4. **Backend Python** — API simple (FastAPI ou Flask) exposant deux endpoints : soumettre un score, récupérer le Top 10
5. **Stockage persistant** — base de données simple (SQLite ou PostgreSQL) stockant chaque entrée (pseudo + score), sans déduplication
6. **Déploiement sécurisé** — HTTPS, CORS configuré, validation des entrées, hébergement gratuit (Render.com ou Railway)

### Out of Scope for MVP

- Authentification / comptes joueurs
- Déduplication par pseudo (chaque soumission = nouvelle entrée)
- Statistiques avancées ou historique personnel
- Mode multijoueur ou temps réel
- Interface d'administration
- Pagination du leaderboard (Top 10 uniquement)

### MVP Success Criteria

- URL publique fonctionnelle
- Partie jouable de bout en bout
- Score soumis et visible dans le Top 10 si suffisamment élevé
- Déployé en production, stable

### Future Vision

N/A — projet d'apprentissage ponctuel, pas de roadmap prévue.
