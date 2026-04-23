const express = require('express');
const { z } = require('zod');
const { pool } = require('../db/pool');

const router = express.Router();

router.get('/', async (req, res) => {
  const raw = req.query.week_ids;
  if (raw == null || raw === '') {
    return res.status(400).json({ error: 'week_ids required' });
  }
  const ids = String(raw)
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
  if (ids.length === 0) {
    return res.json([]);
  }
  const { rows } = await pool.query(
    `SELECT a.id, a.initiative_id, a.week_id, a.cell_text, a.updated_at
     FROM activity_log a
     WHERE a.week_id = ANY($1::int[])
     ORDER BY a.initiative_id, a.week_id`,
    [ids]
  );
  res.json(rows);
});

router.post('/', async (req, res) => {
  const body = z
    .object({
      initiative_id: z.number().int().positive(),
      week_id: z.number().int().positive(),
      cell_text: z.string().max(8000).optional().default(''),
    })
    .parse(req.body);

  const text = body.cell_text.trim();

  const ini = await pool.query('SELECT id, status FROM initiatives WHERE id = $1', [
    body.initiative_id,
  ]);
  if (!ini.rows[0]) {
    return res.status(404).json({ error: 'Initiative not found' });
  }
  if (ini.rows[0].status === 'completed') {
    return res.status(403).json({ error: 'Initiative is completed' });
  }

  const { rows } = await pool.query(
    `INSERT INTO activity_log (initiative_id, week_id, cell_text, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (initiative_id, week_id)
     DO UPDATE SET cell_text = EXCLUDED.cell_text, updated_at = NOW()
     RETURNING id, initiative_id, week_id, cell_text, updated_at`,
    [body.initiative_id, body.week_id, text]
  );
  res.json(rows[0]);
});

module.exports = router;
