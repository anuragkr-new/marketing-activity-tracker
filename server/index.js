const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const themesRoutes = require('./routes/themes');
const initiativesRoutes = require('./routes/initiatives');
const weeksRoutes = require('./routes/weeks');
const activityRoutes = require('./routes/activity');
const { pool } = require('./db/pool');

const app = express();
const PORT = Number(process.env.PORT) || 4000;

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
    return res.status(503).json({
      error:
        'Database tables are missing. Migrations have not been applied. If you use Railway, ensure release runs `npm run db:setup`, or run it once in a shell with DATABASE_URL.',
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
