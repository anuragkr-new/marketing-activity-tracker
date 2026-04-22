const express = require('express');
const { z } = require('zod');
const { pool } = require('../db/pool');
const { requireAuth, requireAdmin, attachDbUser } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, attachDbUser, requireAdmin, async (_req, res) => {
  const { rows } = await pool.query(
    'SELECT id, name, created_at FROM themes ORDER BY name'
  );
  res.json(rows);
});

router.post('/', requireAuth, attachDbUser, requireAdmin, async (req, res) => {
  const body = z.object({ name: z.string().min(1).max(100) }).parse(req.body);
  const { rows } = await pool.query(
    `INSERT INTO themes (name) VALUES ($1) RETURNING id, name, created_at`,
    [body.name.trim()]
  );
  res.status(201).json(rows[0]);
});

router.delete(
  '/:id',
  requireAuth,
  attachDbUser,
  requireAdmin,
  async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const { rows } = await pool.query(
      'SELECT COUNT(*)::int AS c FROM initiatives WHERE theme_id = $1',
      [id]
    );
    if (rows[0].c > 0) {
      return res
        .status(409)
        .json({ error: 'Theme is in use by initiatives' });
    }
    const r = await pool.query('DELETE FROM themes WHERE id = $1', [id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  }
);

module.exports = router;
