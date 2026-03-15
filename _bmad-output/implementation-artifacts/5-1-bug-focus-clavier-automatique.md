# Story 5.1 : Correctif — Focus clavier automatique au chargement

Status: review

## Story

En tant que joueur sur desktop,
je veux que les touches directionnelles fonctionnent immédiatement dès le chargement de la page,
afin de ne pas avoir à cliquer sur la page avant de jouer.

## Acceptance Criteria

1. **Given** la page vient de se charger (sans aucune interaction utilisateur) **When** le joueur appuie sur une touche directionnelle (ArrowUp/Down/Left/Right) **Then** le déplacement est immédiatement déclenché dans le moteur de jeu
2. **Given** la page est chargée **When** l'initialisation JS s'exécute **Then** le focus est automatiquement placé sur l'élément de jeu (`#game-grid`) sans action de l'utilisateur
3. **Given** l'auto-focus est appliqué **When** inspecté **Then** l'outline de focus n'est pas visible visuellement (utiliser `focus({ preventScroll: true })` + pas d'outline sur l'élément cible via `:focus:not(:focus-visible)`)
4. **Given** la modale de fin de partie s'ouvre **When** elle est visible **Then** le focus est capturé par la modale (comportement existant MutationObserver préservé — pas de régression)
5. **Given** l'utilisateur ferme la modale (Rejouer) **When** la modale se masque **Then** le focus revient sur `#game-grid`

## Tasks / Subtasks

- [x] Ajouter `tabindex="-1"` sur `#game-grid` dans `frontend/index.html` (AC: #2)
  - [x] `<div id="game-grid" role="grid" aria-label="Grille de jeu 2048" tabindex="-1">`
- [x] Appeler `document.getElementById('game-grid').focus({ preventScroll: true })` dans la section `// === INIT ===` après `initGame()` (AC: #1, #2)
- [x] Ajouter règle CSS pour masquer l'outline de focus programmatique sur `#game-grid` (AC: #3)
  - [x] `#game-grid:focus:not(:focus-visible) { outline: none; }`
- [x] Restaurer le focus sur `#game-grid` à la fermeture de la modale dans `resetModal()` (AC: #5)
  - [ ] Ajouter `document.getElementById('game-grid').focus({ preventScroll: true })` à la fin de `resetModal()`

## Dev Notes

### Contexte et cause racine

**Fichiers à modifier :** `frontend/index.html`, `frontend/style.css`, `frontend/app.js`

**Cause racine du bug :** Le listener `keydown` est correctement attaché sur `document` (Story 2.3). Cependant, les navigateurs modernes ne déclenchent pas les événements clavier sur `document` tant que le document n'a pas reçu le focus. Sans clic de l'utilisateur, la page reste dans un état "non focusé" — le navigateur possède le focus (barre d'adresse, OS) mais pas le contenu de la page.

La solution standard est de placer le focus programmatiquement sur un élément interactif dès l'initialisation.

---

### Implémentation

#### `frontend/index.html` — ajouter `tabindex="-1"` sur `#game-grid`

```html
<!-- AVANT -->
<div id="game-grid" role="grid" aria-label="Grille de jeu 2048">

<!-- APRÈS -->
<div id="game-grid" role="grid" aria-label="Grille de jeu 2048" tabindex="-1">
```

`tabindex="-1"` permet de recevoir le focus programmatiquement (via `.focus()`) sans entrer dans le flux de navigation Tab.

#### `frontend/style.css` — masquer l'outline de focus programmatique

À ajouter dans la section `/* === GAME SECTION === */` après la règle `*:focus-visible` existante :

```css
/* Focus programmatique sur #game-grid — outline masqué (non interactif par Tab) */
#game-grid:focus:not(:focus-visible) {
  outline: none;
}
```

`:focus-visible` est actif uniquement lors d'une navigation clavier visible (Tab). `.focus()` programmatique sans action utilisateur visible → `:focus-visible` n'est pas déclenché → outline masqué. Cela respecte les recommandations WCAG.

#### `frontend/app.js` — section `// === INIT ===`

```js
// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
  initGame();
  loadLeaderboard();
  document.getElementById('game-grid').focus({ preventScroll: true }); // focus auto — clavier immédiat
});
```

`{ preventScroll: true }` empêche tout scroll indésirable au focus.

#### `frontend/app.js` — restaurer focus dans `resetModal()`

`resetModal()` est la fonction appelée lors du clic sur "Rejouer" (Story 3.2). Elle remet la modale à son état initial. Ajouter en fin de fonction :

```js
function resetModal() {
  // ... code existant (ne pas modifier) ...
  document.getElementById('game-grid').focus({ preventScroll: true }); // restaurer focus après fermeture modale
}
```

---

### Points critiques à ne pas rater

#### 1. NE PAS modifier le MutationObserver existant (focus trap modale)
Story 3.2 a implémenté un MutationObserver qui focus le premier élément de la modale quand elle s'ouvre (`app.js` lignes ~349-358). Ce comportement est correct et ne doit pas être modifié.

#### 2. `tabindex="-1"` sur un `role="grid"` — compatibilité
`tabindex="-1"` sur un élément `role="grid"` est valide selon ARIA. Il permet le focus programmatique sans affecter la navigation keyboard ARIA des cellules filles.

#### 3. `preventScroll: true` obligatoire
Sans cette option, `.focus()` peut faire défiler la page vers l'élément focusé au chargement, ce qui serait déroutant.

#### 4. Identifier `resetModal()` dans app.js
Chercher la fonction `resetModal` (ajoutée en Story 3.2, lignes ~330-350) pour y ajouter le retour de focus.

### Project Structure Notes

- Fichiers modifiés : `frontend/index.html`, `frontend/style.css`, `frontend/app.js`
- Pas de nouveau fichier, pas de dépendance externe
- Un seul ajout HTML (`tabindex="-1"`), une règle CSS, deux appels `.focus()`
- Section `GAME ENGINE`, `DOM`, `CONTROLS`, `API` non modifiées

### References

- [Source: _bmad-output/implementation-artifacts/2-3-controles-clavier-swipe-et-bouton-rejouer.md] — implémentation du listener `keydown` sur `document`
- [Source: _bmad-output/implementation-artifacts/2-1-structure-html-design-system-css.md] — structure HTML `#game-grid`, IDs critiques
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns] — un seul app.js, sections commentées
- [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines] — règle 2 : jamais de nouveau fichier JS
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive Design & Accessibility] — WCAG focus-visible

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Aucun problème rencontré. 22 tests Node.js passés, 0 échoués.

### Completion Notes List

- ✅ `tabindex="-1"` ajouté sur `#game-grid` dans `index.html` — focus programmatique possible sans navigation Tab
- ✅ `document.getElementById('game-grid').focus({ preventScroll: true })` ajouté dans `// === INIT ===` — clavier fonctionnel dès le chargement
- ✅ `#game-grid:focus:not(:focus-visible) { outline: none; }` ajouté dans `style.css` — outline de focus programmatique masqué (conforme WCAG)
- ✅ `document.getElementById('game-grid').focus({ preventScroll: true })` ajouté dans `resetModal()` — focus restauré après fermeture de la modale
- ✅ MutationObserver focus trap de la modale préservé sans modification
- ✅ Listener `keydown` sur `document` préservé sans modification
- ✅ 22 tests : HTML tabindex (3), CSS outline (3), JS INIT focus (5), JS resetModal (6), MutationObserver (3), keydown (2)

### File List

- `frontend/index.html`
- `frontend/style.css`
- `frontend/app.js`
- `test-story-5-1.js`

### Change Log

- 2026-03-15 : Ajout `tabindex="-1"` sur `#game-grid` (index.html) ; règle CSS `#game-grid:focus:not(:focus-visible)` (style.css) ; appel `.focus()` dans INIT et `resetModal()` (app.js)
