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

app.get('/api/health', (_req, res) => res.json({ ok: true }));

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

  // #region agent log
  const payload = {
    sessionId: 'a9573c',
    hypothesisId: 'ERR',
    location: 'server/index.js:errorHandler',
    message: err?.message || String(err),
    data: {
      name: err?.name,
      code: err?.code,
      path: req.path,
      method: req.method,
    },
    timestamp: Date.now(),
  };
  const line = JSON.stringify(payload);
  console.error('[AGENT_DEBUG]', line);
  try {
    fs.appendFileSync(path.join(__dirname, '..', '.cursor', 'debug-a9573c.log'), `${line}\n`);
  } catch {
    /* ignore */
  }
  fetch('http://127.0.0.1:7904/ingest/5b45e50a-8745-4974-be29-ba0dbafe7bcf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'a9573c' },
    body: line,
  }).catch(() => {});
  // #endregion

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
  if (!fs.existsSync(indexHtml)) {
    console.warn(
      'client/dist/index.html missing — run `npm run build` from repo root before production.'
    );
  }
});
