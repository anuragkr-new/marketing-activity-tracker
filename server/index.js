require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const themesRoutes = require('./routes/themes');
const initiativesRoutes = require('./routes/initiatives');
const weeksRoutes = require('./routes/weeks');
const activityRoutes = require('./routes/activity');
const app = express();
const PORT = Number(process.env.PORT) || 4000;

// #region agent log
console.error(
  '[AGENT_DEBUG]',
  JSON.stringify({
    sessionId: 'a9573c',
    hypothesisId: 'H1',
    location: 'server/index.js:boot',
    message: 'express_api_boot',
    data: {
      railwayService: process.env.RAILWAY_SERVICE_NAME || null,
      railwayReplica: process.env.RAILWAY_REPLICA_ID || null,
      port: PORT,
    },
    timestamp: Date.now(),
  })
);
fetch('http://127.0.0.1:7904/ingest/5b45e50a-8745-4974-be29-ba0dbafe7bcf', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'a9573c' },
  body: JSON.stringify({
    sessionId: 'a9573c',
    hypothesisId: 'H1',
    location: 'server/index.js:boot',
    message: 'express_api_boot',
    data: { port: PORT },
    timestamp: Date.now(),
  }),
}).catch(() => {});
// #endregion

const clientOriginsRaw =
  process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const clientOrigins = clientOriginsRaw
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: clientOrigins.length === 1 ? clientOrigins[0] : clientOrigins,
    credentials: false,
  })
);
app.use(express.json());

// #region agent log
app.use((req, res, next) => {
  if (req.method === 'GET' && req.path === '/') {
    console.error(
      '[AGENT_DEBUG]',
      JSON.stringify({
        sessionId: 'a9573c',
        hypothesisId: 'H2',
        location: 'server/index.js:root_request',
        message: 'express_get_slash_no_handler',
        data: { path: req.path },
        timestamp: Date.now(),
      })
    );
    fetch('http://127.0.0.1:7904/ingest/5b45e50a-8745-4974-be29-ba0dbafe7bcf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'a9573c' },
      body: JSON.stringify({
        sessionId: 'a9573c',
        hypothesisId: 'H2',
        location: 'server/index.js:root_request',
        message: 'express_get_slash',
        data: { path: req.path },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }
  next();
});
// #endregion

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/themes', themesRoutes);
app.use('/api/initiatives', initiativesRoutes);
app.use('/api/weeks', weeksRoutes);
app.use('/api/activity', activityRoutes);

app.use((err, _req, res, _next) => {
  if (err?.name === 'ZodError') {
    return res.status(400).json({ error: err.errors?.[0]?.message || 'Validation error' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
