# Story 2.1 : Structure HTML & design system CSS

Status: review

## Story

En tant qu'agent de développement,
je veux implémenter la structure HTML sémantique et le design system CSS complet,
afin que la page soit visuellement conforme aux spécifications UX et responsive dès le premier rendu.

## Acceptance Criteria

1. **Given** `index.html` ouvert dans un navigateur moderne **When** la page se charge **Then** la structure sémantique est présente : `<main>`, `<section>` pour la grille, `<section>` pour le leaderboard, `<h1>` avec le titre du jeu ; badge "Made with AI ✨" visible dans un coin fixe (`aria-hidden="true"`) ; fond `#F5F0EB` avec motif géométrique CSS (pas d'`<img>` décoratif)
2. **Given** `style.css` chargée **When** les variables CSS sont inspectées **Then** les 8 tokens couleur sont définis en `:root` : `--color-bg`, `--color-surface`, `--color-grid-bg`, `--color-cell-empty`, `--color-primary`, `--color-success`, `--color-text`, `--color-text-light`
3. **And** les couleurs de tuiles sont définies par palier : `--color-tile-2` à `--color-tile-2048` (au moins 11 paliers)
4. **Given** un viewport ≥ 768px (desktop) **When** la page est affichée **Then** layout 2 colonnes via Flexbox (grille ~60%, leaderboard ~40%), `max-width: 960px` centré, `padding: 32px`
5. **Given** un viewport < 768px (mobile) **When** la page est affichée **Then** layout 1 colonne, grille pleine largeur, leaderboard masqué (`display: none`)
6. **Given** `style.css` chargée **When** les boutons sont rendus **Then** Primary : fond `#8B7BA8`, texte blanc, `border-radius: 10px` ; Secondary : fond `#F5F0EB`, texte `#3D3540`, même shape ; tous les éléments focusables ont `outline: 2px solid #8B7BA8`

## Tasks / Subtasks

- [x] Implémenter `frontend/index.html` — structure complète (AC: #1)
  - [x] Doctype HTML5 + `<html lang="fr">` + `<head>` avec meta charset, viewport, title
  - [x] Chargement des polices Google Fonts (Nunito + Inter) dans `<head>`
  - [x] `<link>` vers `style.css` et `<script defer>` vers `app.js`
  - [x] Badge AIBadge : `<div class="ai-badge" aria-hidden="true">Made with AI ✨</div>`
  - [x] `<main>` avec 2 sections : `.game-section` (grille + scores) et `.leaderboard-section`
  - [x] Dans `.game-section` : `<h1>`, zone `.score-area` (score courant + best score), `#game-grid` (`role="grid"`, `aria-label="Grille de jeu 2048"`), 16 cellules `.cell` vides
  - [x] `#game-over-modal` (`role="dialog"`, `aria-modal="true"`, `aria-labelledby="modal-title"`) avec overlay, carte, champ pseudo, boutons
  - [x] Dans `.leaderboard-section` : titre + `#leaderboard-list`
- [x] Implémenter `frontend/style.css` — tokens et layout (AC: #2, #3, #4, #5, #6)
  - [x] Reset CSS minimal (box-sizing, margin/padding 0)
  - [x] Variables CSS en `:root` : 8 tokens couleur + 11+ couleurs de tuiles
  - [x] Layout desktop : `.layout` Flexbox, `max-width: 960px`, `padding: 32px`
  - [x] Layout mobile-first : section leaderboard `display: none` par défaut, `display: block` en desktop
  - [x] Fond de page : `background-color: var(--color-bg)` + motif géométrique CSS via `background-image`
  - [x] Styles GameGrid : `display: grid`, `grid-template-columns: repeat(4, 1fr)`, `width: min(80vw, 400px)`, fond `--color-grid-bg`, gap, border-radius
  - [x] Styles cellules `.cell` : fond `--color-cell-empty`, border-radius, aspect-ratio 1
  - [x] Styles tuiles `.tile` par valeur : `data-value` selector, couleur de fond depuis tokens, transition
  - [x] Styles ScoreBox : label + valeur, variant score courant / best score
  - [x] Styles boutons Primary et Secondary
  - [x] Focus outline universel : `*:focus-visible { outline: 2px solid var(--color-primary); }`
  - [x] Badge `.ai-badge` : position fixe, coin bas-droit, style discret
  - [x] Styles `#game-over-modal` : overlay, carte centrée, animation d'entrée (`scale 0.95→1`, `opacity 0→1`, 150ms), caché par défaut
  - [x] Styles leaderboard : liste, rangées, médailles top 3
  - [x] Styles skeleton loader (3 barres animées) pour chargement initial

## Dev Notes

### Contexte

Cette story crée le squelette visuel complet du jeu — HTML sémantique et CSS design system. Elle est **purement statique** : aucune logique JS ne sera ajoutée. Les éléments HTML créés ici sont utilisés par Stories 2.2 et 2.3 (moteur de jeu et contrôles), donc leur structure et leurs IDs/classes doivent être exacts.

**Fichiers modifiés :** `frontend/index.html` et `frontend/style.css` (tous deux vides depuis Story 1.1).

**Important :** `frontend/app.js` reste vide dans cette story.

---

### IDs et classes critiques (utilisés par Stories 2.2, 2.3, 3.x)

| Élément | ID/Classe | Utilisé en |
|---|---|---|
| Grille de jeu | `#game-grid` | Story 2.2 |
| Cellules | `.cell` (×16) | Story 2.2 |
| Score courant | `#score-display` | Story 2.2 |
| Meilleur score | `#best-score-display` | Story 2.2 |
| Bouton rejouer | `#restart-btn` | Story 2.3 |
| Modale fin de partie | `#game-over-modal` | Stories 2.2, 3.2 |
| Score dans modale | `#modal-score-display` | Story 2.2 |
| Rang affiché | `#modal-rank-display` | Story 3.2 |
| Erreur modale | `#modal-error`, `#modal-error-text` | Story 3.2 |
| Input pseudo | `#pseudo-input` | Story 3.2 |
| Bouton enregistrer | `#submit-score-btn` | Story 3.2 |
| Bouton réessayer | `#retry-btn` | Story 3.2 |
| Bouton rejouer (modale) | `#modal-restart-btn` | Story 3.2 |
| Liste leaderboard | `#leaderboard-list` | Stories 3.1, 3.2 |

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design System Foundation]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Visual Design Foundation]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive Design & Accessibility]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Aucun problème rencontré.

### Completion Notes List

- ✅ `frontend/index.html` : structure HTML5 sémantique complète, 14 IDs critiques créés, 16 `.cell`, `aria-live`, `role=dialog`, `aria-modal`, badge `aria-hidden`
- ✅ `frontend/style.css` : reset, 8 tokens couleur, 11 couleurs tuiles, layout Flexbox mobile-first, GameGrid CSS Grid, animations tuile (merge 1.1x), modale (scale 0.95→1 + opacity), skeleton shimmer, boutons primary/secondary, focus-visible, badge fixe
- ✅ Fond géométrique CSS pur via `background-image` gradient (pas d'`<img>`)
- ✅ Validation Python : 48/48 vérifications passées

### File List

- `frontend/index.html`
- `frontend/style.css`

### Change Log

- 2026-03-15 : Implémentation initiale — HTML sémantique complet + design system CSS (tokens, layout, composants)
