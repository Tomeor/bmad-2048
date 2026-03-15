'use strict';
// Tests Story 4.2 — Sécurité CORS et validation configuration
// Exécuter avec : node test-story-4-2.js

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

const ROOT = path.join(__dirname);
const mainPy = fs.readFileSync(path.join(ROOT, 'backend', 'main.py'), 'utf8');
const renderYaml = fs.readFileSync(path.join(ROOT, 'render.yaml'), 'utf8');
const envExample = fs.readFileSync(path.join(ROOT, 'backend', '.env.example'), 'utf8');

// ============================================================
// 1. CORS — configuration depuis variable d'environnement
// ============================================================
console.log('\n--- CORS — source variable d\'environnement (AC: #1) ---');

assert(
  mainPy.includes('os.getenv("FRONTEND_ORIGIN"'),
  'FRONTEND_ORIGIN lu depuis os.getenv'
);
assert(
  mainPy.includes('FRONTEND_ORIGIN = os.getenv('),
  'FRONTEND_ORIGIN assigné à une variable depuis os.getenv'
);
// Pas de valeur https:// hardcodée dans allow_origins
assert(
  !mainPy.match(/allow_origins\s*=\s*\[\s*["']https?:\/\//),
  'Aucune URL https:// hardcodée dans allow_origins'
);
assert(
  !mainPy.match(/allow_origins\s*=\s*\[\s*["']http:\/\/[a-z]/),
  'Aucune URL http:// hardcodée dans allow_origins (hors getenv default)'
);
assert(
  mainPy.includes('allow_origins=[FRONTEND_ORIGIN]'),
  'allow_origins utilise la variable FRONTEND_ORIGIN (pas de valeur en dur)'
);

// ============================================================
// 2. CORS — paramètres complets du middleware
// ============================================================
console.log('\n--- CORS — paramètres middleware (AC: #1) ---');

assert(
  mainPy.includes('CORSMiddleware'),
  'CORSMiddleware importé et utilisé'
);
assert(
  mainPy.includes('allow_credentials=True'),
  'allow_credentials=True configuré'
);
assert(
  mainPy.includes('allow_methods=["*"]'),
  'allow_methods=["*"] — tous les verbes HTTP autorisés'
);
assert(
  mainPy.includes('allow_headers=["*"]'),
  'allow_headers=["*"] — tous les headers autorisés'
);

// ============================================================
// 3. Ordre middleware CORS avant SlowAPI
// ============================================================
console.log('\n--- Ordre middleware (AC: #1) ---');

const corsPos = mainPy.indexOf('CORSMiddleware');
const slowapiPos = mainPy.indexOf('SlowAPIMiddleware');

assert(corsPos > -1, 'CORSMiddleware présent dans main.py');
assert(slowapiPos > -1, 'SlowAPIMiddleware présent dans main.py');
assert(
  corsPos < slowapiPos,
  'CORSMiddleware ajouté avant SlowAPIMiddleware (ordre correct)'
);

// ============================================================
// 4. Valeur par défaut FRONTEND_ORIGIN — compatible dev local
// ============================================================
console.log('\n--- Valeur par défaut dev local ---');

assert(
  mainPy.includes('"http://localhost:8080"') || mainPy.includes("'http://localhost:8080'"),
  'Valeur par défaut localhost:8080 pour dev local'
);

// ============================================================
// 5. Secrets exclusivement en variables d'environnement (AC: #5)
// ============================================================
console.log('\n--- Secrets via variables d\'environnement (AC: #5) ---');

// Aucune URL PostgreSQL hardcodée dans main.py
assert(
  !mainPy.includes('postgresql://'),
  'Aucune URL PostgreSQL hardcodée dans main.py'
);
assert(
  !mainPy.includes('sqlite:///'),
  'Aucune URL SQLite hardcodée dans main.py (base est dans database.py via env)'
);

// render.yaml — pas de credential en clair
assert(
  !renderYaml.includes('postgresql://'),
  'Aucune URL PostgreSQL dans render.yaml (via fromDatabase)'
);
assert(
  renderYaml.includes('fromDatabase:'),
  'DATABASE_URL via fromDatabase (credentials jamais exposés)'
);

// .env.example — template uniquement, pas de vraies credentials
assert(
  envExample.includes('DATABASE_URL='),
  'DATABASE_URL documentée dans .env.example'
);
assert(
  envExample.includes('FRONTEND_ORIGIN='),
  'FRONTEND_ORIGIN documentée dans .env.example'
);
assert(
  !envExample.includes('postgresql://user:password@'),
  'Aucune vraie credential PostgreSQL dans .env.example'
);

// ============================================================
// 6. Import os et load_dotenv présents
// ============================================================
console.log('\n--- Chargement configuration ---');

assert(
  mainPy.includes('import os'),
  'import os présent (accès env vars)'
);
assert(
  mainPy.includes('from dotenv import load_dotenv'),
  'load_dotenv importé (chargement .env local)'
);
assert(
  mainPy.includes('load_dotenv()'),
  'load_dotenv() appelé au démarrage'
);

// ============================================================
// 7. Régression — routes API avant StaticFiles (déjà testé 4.1)
// ============================================================
console.log('\n--- Régression — ordre routes/StaticFiles ---');

const postScoresPos = mainPy.indexOf('@app.post("/scores"');
const mountPos = mainPy.indexOf('app.mount("/", StaticFiles');
assert(
  postScoresPos < mountPos,
  'Régression OK : routes API avant StaticFiles'
);

// ============================================================
// Rapport final
// ============================================================
console.log(`\n${'='.repeat(50)}`);
console.log(`Tests Story 4.2 : ${passed} passés, ${failed} échoués`);
if (failed > 0) {
  console.error('❌ DES TESTS ONT ÉCHOUÉ');
  process.exit(1);
} else {
  console.log('✅ Tous les tests passent');
}
