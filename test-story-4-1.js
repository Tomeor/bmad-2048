'use strict';
// Tests Story 4.1 — Configuration render.yaml
// Exécuter avec : node test-story-4-1.js

const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${label}`);
    failed++;
  }
}

// ============================================================
// Lecture des fichiers
// ============================================================

const ROOT = path.join(__dirname);
const renderYamlPath = path.join(ROOT, 'render.yaml');
const mainPyPath = path.join(ROOT, 'backend', 'main.py');
const requirementsTxtPath = path.join(ROOT, 'backend', 'requirements.txt');

const renderYaml = fs.readFileSync(renderYamlPath, 'utf8');
const mainPy = fs.readFileSync(mainPyPath, 'utf8');
const requirementsTxt = fs.readFileSync(requirementsTxtPath, 'utf8');

// ============================================================
// Tests render.yaml
// ============================================================
console.log('\n--- render.yaml — structure générale ---');

assert(renderYaml.includes('services:'), 'Section "services:" présente');
assert(renderYaml.includes('databases:'), 'Section "databases:" présente');

console.log('\n--- render.yaml — service web ---');

assert(renderYaml.includes('type: web'), 'type: web défini');
assert(renderYaml.includes('name: test-bmad'), 'name: test-bmad défini');
assert(renderYaml.includes('env: python'), 'env: python défini');

console.log('\n--- render.yaml — buildCommand et startCommand ---');

assert(
  renderYaml.includes('buildCommand: pip install -r backend/requirements.txt'),
  'buildCommand correct'
);
assert(
  renderYaml.includes('startCommand: uvicorn backend.main:app --host 0.0.0.0 --port $PORT'),
  'startCommand correct avec $PORT'
);
assert(
  !renderYaml.includes('--port 8000'),
  'Port 8000 hardcodé absent (utilise $PORT)'
);

console.log('\n--- render.yaml — variables d\'environnement ---');

assert(renderYaml.includes('DATABASE_URL'), 'Variable DATABASE_URL présente');
assert(renderYaml.includes('fromDatabase:'), 'fromDatabase présent pour DATABASE_URL');
assert(renderYaml.includes('name: test-bmad-db'), 'Référence à test-bmad-db dans fromDatabase');
assert(renderYaml.includes('property: connectionString'), 'property: connectionString');
assert(renderYaml.includes('FRONTEND_ORIGIN'), 'Variable FRONTEND_ORIGIN présente');
assert(
  renderYaml.includes('https://test-bmad.onrender.com'),
  'URL Render correcte pour FRONTEND_ORIGIN'
);

console.log('\n--- render.yaml — base de données ---');

assert(renderYaml.includes('plan: free'), 'Plan free pour la base de données');

// Vérifier que test-bmad-db apparaît dans databases section
const dbSection = renderYaml.substring(renderYaml.indexOf('databases:'));
assert(
  dbSection.includes('name: test-bmad-db'),
  'test-bmad-db déclaré dans la section databases'
);

// ============================================================
// Tests backend/main.py
// ============================================================
console.log('\n--- backend/main.py — StaticFiles ---');

assert(
  mainPy.includes("StaticFiles(directory=\"frontend\", html=True)"),
  'StaticFiles avec directory="frontend" et html=True'
);
assert(
  mainPy.includes('app.mount("/", StaticFiles'),
  'StaticFiles monté sur "/"'
);

console.log('\n--- backend/main.py — ordre routes avant StaticFiles ---');

const postScoresPos = mainPy.indexOf('@app.post("/scores"');
const getTop10Pos = mainPy.indexOf('@app.get("/scores/top10"');
const mountPos = mainPy.indexOf('app.mount("/", StaticFiles');

assert(postScoresPos > -1, 'Route POST /scores présente dans main.py');
assert(getTop10Pos > -1, 'Route GET /scores/top10 présente dans main.py');
assert(mountPos > -1, 'app.mount StaticFiles présent dans main.py');
assert(
  postScoresPos < mountPos,
  'Route POST /scores déclarée AVANT StaticFiles mount'
);
assert(
  getTop10Pos < mountPos,
  'Route GET /scores/top10 déclarée AVANT StaticFiles mount'
);

// ============================================================
// Tests backend/requirements.txt
// ============================================================
console.log('\n--- backend/requirements.txt ---');

const deps = requirementsTxt.split('\n').map(l => l.trim()).filter(Boolean);

assert(deps.some(d => d.startsWith('fastapi')), 'fastapi présent');
assert(deps.some(d => d.startsWith('uvicorn')), 'uvicorn présent');
assert(deps.some(d => d.startsWith('sqlalchemy')), 'sqlalchemy présent');
assert(deps.some(d => d.startsWith('psycopg2-binary')), 'psycopg2-binary présent (driver PostgreSQL)');
assert(deps.some(d => d.startsWith('python-dotenv')), 'python-dotenv présent');
assert(deps.some(d => d.startsWith('slowapi')), 'slowapi présent');

// ============================================================
// Rapport final
// ============================================================
console.log(`\n${'='.repeat(50)}`);
console.log(`Tests Story 4.1 : ${passed} passés, ${failed} échoués`);
if (failed > 0) {
  console.error('❌ DES TESTS ONT ÉCHOUÉ');
  process.exit(1);
} else {
  console.log('✅ Tous les tests passent');
}
