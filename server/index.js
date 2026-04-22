const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const themesRoutes = require('./routes/themes');
const ownersRoutes = require('./routes/owners');
const initiativesRoutes = require('./routes/initiatives');
const weeksRoutes = require('./routes/weeks');
const activityRoutes = require('./routes/activity');
const { pool } = require('./db/pool');

const app = express();
const PORT = Number(process.env.PORT) || 4000;

function agentDebugLog(payload) {
  const entry = { sessionId: 'a9573c', timestamp: Date.now(), ...payload };
  const line = JSON.stringify(entry);
  // #region agent log
  fetch('http://127.0.0.1:7904/ingest/5b45e50a-8745-4974-be29-ba0dbafe7bcf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'a9573c' },
    body: line,
  }).catch(() => {});
  // #endregion
}

// Same-origin SPA in production; dev often uses Vite on another port — allow reflected origin.
app.use(
  cors({
    origin: true,
    credentials: false,
  })
);
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ ok: false, reason: 'missing_database_url' });
  }
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
    } finally {
      client.release();
    }
    return res.json({ ok: true, db: true });
  } catch (e) {
    return res.status(503).json({
      ok: false,
      reason: 'database_unavailable',
      ...(process.env.EXPOSE_ERROR_MESSAGE === 'true'
        ? { error: e?.message || String(e) }
        : {}),
    });
  }
});

app.use('/api/themes', themesRoutes);
app.use('/api/owners', ownersRoutes);
app.use('/api/initiatives', initiativesRoutes);
app.use('/api/weeks', weeksRoutes);
app.use('/api/activity', activityRoutes);

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const distDir = path.join(__dirname, '..', 'client', 'dist');
const indexHtml = path.join(distDir, 'index.html');

if (fs.existsSync(indexHtml)) {
  app.use(express.static(distDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(indexHtml, (err) => {
      if (err) next(err);
    });
  });
}

app.use((err, req, res, _next) => {
  if (err?.name === 'ZodError') {
    return res.status(400).json({ error: err.errors?.[0]?.message || 'Validation error' });
  }

  if (err?.code === '42P01') {
    console.error('[api-error]', {
      method: req.method,
      path: req.path,
      code: err.code,
      message: err.message,
    });
    agentDebugLog({
      runId: process.env.DEBUG_RUN_ID || 'pre',
      hypothesisId: 'H5',
      location: 'server/index.js:errorHandler',
      message: '42P01 missing relation',
      data: { path: req.path, method: req.method },
    });
    return res.status(503).json({
      error:
        'Database tables are missing. On Railway, redeploy so boot can run db:setup, set AUTO_DB_SETUP_ON_START=true, or run npm run db:setup via railway ssh.',
      code: '42P01',
    });
  }

  console.error('[api-error]', {
    method: req.method,
    path: req.path,
    code: err?.code,
    message: err?.message,
  });
  console.error(err);

  const expose =
    process.env.EXPOSE_ERROR_MESSAGE === 'true' || process.env.NODE_ENV !== 'production';
  res.status(500).json({
    error: expose ? err.message || 'Internal server error' : 'Internal server error',
    ...(expose && err.code ? { code: err.code } : {}),
  });
});

function runDbSetupOnBoot() {
  let branch = 'run';
  if (process.env.SKIP_DB_SETUP_ON_START === 'true') {
    branch = 'skip_skipFlag';
    console.log('[boot] SKIP_DB_SETUP_ON_START — not running db:setup');
  } else {
    const shouldRun =
      process.env.RAILWAY_ENVIRONMENT || process.env.AUTO_DB_SETUP_ON_START === 'true';
    if (!shouldRun) branch = 'skip_no_trigger';
    else if (!process.env.DATABASE_URL) branch = 'skip_no_dburl';
  }
  agentDebugLog({
    runId: process.env.DEBUG_RUN_ID || 'pre',
    hypothesisId: 'H1-H3',
    location: 'server/index.js:runDbSetupOnBoot',
    message: 'boot db:setup gate',
    data: {
      branch,
      hasRailwayEnv: Boolean(process.env.RAILWAY_ENVIRONMENT),
      hasAutoFlag: process.env.AUTO_DB_SETUP_ON_START === 'true',
      hasDbUrl: Boolean(process.env.DATABASE_URL),
    },
  });
  if (branch !== 'run') return;

  const root = path.join(__dirname, '..');
  console.log('[boot] Running npm run db:setup (migrate + seed)…');
  const r = spawnSync('npm', ['run', 'db:setup'], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });
  agentDebugLog({
    runId: process.env.DEBUG_RUN_ID || 'pre',
    hypothesisId: 'H4',
    location: 'server/index.js:runDbSetupOnBoot:afterSpawn',
    message: 'db:setup spawn result',
    data: { exitCode: r.status, signal: r.signal != null ? String(r.signal) : null },
  });
  if (r.status !== 0) {
    console.error('[boot] db:setup exited with code', r.status);
  } else {
    console.log('[boot] db:setup finished');
  }
}

runDbSetupOnBoot();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set — /api routes that use Postgres will fail.');
  }
  if (!fs.existsSync(indexHtml)) {
    console.warn(
      'client/dist/index.html missing — run `npm run build` from repo root before production.'
    );
  }
});
