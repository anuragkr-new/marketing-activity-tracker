const express = require('express');
const { z } = require('zod');
const { pool } = require('../db/pool');

const router = express.Router();

router.get('/', async (_req, res) => {
  const { rows } = await pool.query(
    'SELECT id, name, created_at FROM owners ORDER BY name'
  );
  res.json(rows);
});

router.post('/', async (req, res) => {
  const body = z.object({ name: z.string().min(1).max(100) }).parse(req.body);
  try {
    const { rows } = await pool.query(
      `INSERT INTO owners (name) VALUES ($1) RETURNING id, name, created_at`,
      [body.name.trim()]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') {
      return res.status(400).json({ error: 'An owner with that name already exists' });
    }
    throw e;
  }
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  const { rows } = await pool.query(
    'SELECT COUNT(*)::int AS c FROM initiatives WHERE owner_id = $1',
    [id]
  );
  if (rows[0].c > 0) {
    return res.status(400).json({ error: 'Owner is in use by initiatives' });
  }
  const r = await pool.query('DELETE FROM owners WHERE id = $1', [id]);
  if (r.rowCount === 0) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
});

module.exports = router;
