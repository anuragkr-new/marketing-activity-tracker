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
