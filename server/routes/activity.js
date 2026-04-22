const express = require('express');
const { z } = require('zod');
const { pool } = require('../db/pool');
const { requireAuth, attachDbUser } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, attachDbUser);

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
    `SELECT a.id, a.initiative_id, a.week_id, a.worked_on, a.updated_at,
            u.username AS updated_by_username
     FROM activity_log a
     LEFT JOIN users u ON u.id = a.updated_by
     WHERE a.week_id = ANY($1::int[])
     ORDER BY a.initiative_id, a.week_id`,
    [ids]
  );
  res.json(rows);
});

router.post('/toggle', async (req, res) => {
  const body = z
    .object({
      initiative_id: z.number().int().positive(),
      week_id: z.number().int().positive(),
    })
    .parse(req.body);

  const ini = await pool.query(
    'SELECT id, status FROM initiatives WHERE id = $1',
    [body.initiative_id]
  );
  if (!ini.rows[0]) {
    return res.status(404).json({ error: 'Initiative not found' });
  }
  if (ini.rows[0].status === 'completed') {
    return res.status(403).json({ error: 'Initiative is completed' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query(
      `SELECT id, worked_on FROM activity_log
       WHERE initiative_id = $1 AND week_id = $2 FOR UPDATE`,
      [body.initiative_id, body.week_id]
    );
    let row;
    if (!existing.rows[0]) {
      const ins = await client.query(
        `INSERT INTO activity_log (initiative_id, week_id, worked_on, updated_by, updated_at)
         VALUES ($1, $2, true, $3, NOW())
         RETURNING id, initiative_id, week_id, worked_on, updated_at`,
        [body.initiative_id, body.week_id, req.dbUser.id]
      );
      row = ins.rows[0];
    } else {
      const upd = await client.query(
        `UPDATE activity_log
         SET worked_on = NOT worked_on, updated_by = $3, updated_at = NOW()
         WHERE initiative_id = $1 AND week_id = $2
         RETURNING id, initiative_id, week_id, worked_on, updated_at`,
        [body.initiative_id, body.week_id, req.dbUser.id]
      );
      row = upd.rows[0];
    }
    await client.query('COMMIT');
    const withUser = await pool.query(
      `SELECT a.id, a.initiative_id, a.week_id, a.worked_on, a.updated_at,
              u.username AS updated_by_username
       FROM activity_log a
       LEFT JOIN users u ON u.id = a.updated_by
       WHERE a.id = $1`,
      [row.id]
    );
    res.json(withUser.rows[0]);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
});

module.exports = router;
