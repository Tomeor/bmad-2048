# Story 5.2 : Correctif — Leaderboard non affiché sur desktop

Status: review

## Story

En tant que joueur sur desktop,
je veux voir le leaderboard affiché en permanence à côté de la grille de jeu,
afin de consulter le classement pendant ma partie sans attendre la fin.

## Acceptance Criteria

1. **Given** un viewport ≥ 768px **When** la page est chargée **Then** la `.leaderboard-section` est visible (layout 2 colonnes : grille ~60% à gauche, leaderboard ~40% à droite) sans aucune interaction
2. **Given** un viewport < 768px **When** la page est chargée **Then** la `.leaderboard-section` reste masquée pendant la partie (comportement mobile inchangé)
3. **Given** une partie mobile se termine **When** la soumission de score est validée **Then** le leaderboard apparaît sur mobile via la classe `.visible` (comportement existant Story 3.2 préservé — pas de régression)
4. **Given** un viewport desktop **When** la partie est en cours **Then** le leaderboard affiche le Top 10 chargé au démarrage (via `loadLeaderboard()` — Story 3.1 inchangée)
5. **Given** la correction CSS appliquée **When** les DevTools sont ouverts en mode responsive **Then** passage desktop↔mobile fonctionne correctement (leaderboard visible ≥768px, masqué <768px)

## Tasks / Subtasks

- [x] Corriger l'ordre CSS dans `frontend/style.css` (AC: #1, #2, #5)
  - [x] Déplacer le bloc `.leaderboard-section { display: none; ... }` pour qu'il apparaisse AVANT le media query `@media (min-width: 768px)` dans le fichier
  - [x] Vérifier que la classe `.leaderboard-section.visible` (ajoutée par JS mobile) reste fonctionnelle

## Dev Notes

### Contexte et cause racine

**Fichier à modifier :** `frontend/style.css` **uniquement**

**Cause racine du bug — cascade CSS :**

Le CSS suit la règle de la cascade : à spécificité égale, la règle déclarée en dernier gagne.

État actuel dans `style.css` :

```css
/* Ligne ~84 — media query desktop */
@media (min-width: 768px) {
  .leaderboard-section { flex: 4; display: block; }  /* spécificité 0,1,0 */
}

/* ... 270 lignes plus bas ... */

/* Ligne ~361 — règle base */
.leaderboard-section {
  display: none;   /* spécificité 0,1,0 — ÉCRASE le display:block du media query car déclaré APRÈS */
}
```

Comme `.leaderboard-section { display: none; }` est déclaré **après** le media query dans le fichier, il l'écrase à spécificité égale — y compris sur desktop. Résultat : le leaderboard ne s'affiche jamais pendant la partie, quelle que soit la taille d'écran.

---

### Correction

**Solution : Déplacer `.leaderboard-section { display: none; ... }` avant le media query.**

Structure CSS cible dans `frontend/style.css` :

```css
/* === LAYOUT === */
/* Mobile-first : 1 colonne */
.layout {
  display: flex;
  flex-direction: column;
  max-width: 960px;
  margin: 0 auto;
  padding: 16px;
  gap: 24px;
  position: relative;
}

/* === LEADERBOARD (déclaration base — AVANT le media query) === */
/* Masqué sur mobile par défaut (UX-DR9) */
.leaderboard-section {
  display: none;
  background: var(--color-surface);
  border-radius: var(--radius-surface);
  padding: 24px;
  /* ... autres propriétés existantes inchangées ... */
}

/* Visible sur mobile post-partie (classe ajoutée par JS en Story 3.2) */
.leaderboard-section.visible {
  display: block;
}

/* Desktop : 2 colonnes Flexbox (grille ~60% / leaderboard ~40%) */
@media (min-width: 768px) {
  .layout {
    flex-direction: row;
    align-items: flex-start;
    padding: 32px;
    gap: 32px;
  }

  .game-section        { flex: 6; }
  .leaderboard-section { flex: 4; display: block; }  /* override display:none — cascade correcte */
}
```

**Pourquoi ça fonctionne après correction :**
- Mobile : `.leaderboard-section { display: none; }` s'applique (pas de media query active)
- Mobile post-partie : `.leaderboard-section.visible { display: block; }` override (spécificité 0,2,0 > 0,1,0) ✅
- Desktop : `@media (min-width: 768px) { .leaderboard-section { display: block; } }` override (déclaré APRÈS) ✅

---

### Points critiques à ne pas rater

#### 1. Déplacer le BLOC ENTIER `.leaderboard-section`
Déplacer tout le bloc de styles `.leaderboard-section` (incluant ses règles enfants comme `.leaderboard-section h2`, `.leaderboard-row`, etc.), pas seulement la règle `display: none`.

Identifier le début et la fin de la section `/* === LEADERBOARD === */` dans `style.css` (actuellement vers la ligne 359) et déplacer toute cette section avant le media query (actuellement ligne ~84).

#### 2. Préserver `.leaderboard-section.visible`
Cette classe est ajoutée par JS en Story 3.2 pour afficher le leaderboard sur mobile en fin de partie (`app.js` : `document.querySelector('.leaderboard-section').classList.add('visible')`). Elle doit rester dans le bloc déplacé — sa spécificité 0,2,0 continue d'overrider `display: none`.

#### 3. Tester le résultat dans les DevTools
En mode responsive des DevTools :
- À 375px (mobile) : `.leaderboard-section` = `display: none` ✅
- À 1024px (desktop) : `.leaderboard-section` = `display: block`, layout 2 colonnes ✅

#### 4. Aucun changement JS requis
La fonction `loadLeaderboard()` charge déjà les données en arrière-plan sur mobile (Story 3.1). Le leaderboard sera alimenté dès l'affichage desktop — pas de nouvelle logique fetch nécessaire.

#### 5. Aucun changement HTML requis
La structure HTML `.leaderboard-section` est correcte depuis Story 2.1. Le bug est exclusivement dans l'ordre des règles CSS.

### Project Structure Notes

- Fichier modifié : `frontend/style.css` uniquement
- Pas de nouveau fichier
- Aucune logique JS modifiée
- Changement purement structurel dans l'ordre de déclaration CSS

### References

- [Source: _bmad-output/implementation-artifacts/2-1-structure-html-design-system-css.md#AC4, AC5] — spec layout desktop/mobile
- [Source: _bmad-output/implementation-artifacts/3-1-chargement-initial-du-leaderboard.md#Note 3] — "visibilité mobile gérée par CSS, pas par JS — `.leaderboard-section { display: none }` par défaut"
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] — leaderboard sidebar desktop (≥768px), masqué mobile
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns] — un seul fichier CSS, sections commentées
- [Source: frontend/style.css:84] — media query desktop (référence actuelle)
- [Source: frontend/style.css:361] — `.leaderboard-section { display: none }` (position incorrecte actuelle)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Première passe du test : regex trop large (match cross-blocs `[\s\S]*?`). Corrigée avec une recherche ligne par ligne.

### Completion Notes List

- ✅ Bloc `/* === LEADERBOARD === */` déplacé de la ligne ~464 à la ligne 88 (avant le media query desktop ligne 195)
- ✅ Cascade CSS corrigée : `display: none` (ligne 90) → overridé par `display: block` du media query (ligne 204)
- ✅ `.leaderboard-section.visible { display: block }` conservée (spécificité 0,2,0 — mobile post-partie préservé)
- ✅ Aucune modification HTML ni JS requise
- ✅ 25 tests Node.js passés, 0 échoués (+ 71+24+22 tests de non-régression)

### File List

- `frontend/style.css`
- `test-story-5-2.js`

### Change Log

- 2026-03-15 : Déplacement du bloc `/* === LEADERBOARD === */` avant le media query `@media (min-width: 768px)` dans `style.css` — correction de la cascade CSS qui masquait le leaderboard sur desktop
