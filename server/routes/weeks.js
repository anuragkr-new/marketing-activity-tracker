const express = require('express');
const { pool } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const {
  mondayOfCalendarWeek,
  addDays,
} = require('../lib/isoWeek');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const offset = Number(req.query.offset ?? 0);
  if (!Number.isFinite(offset)) {
    return res.status(400).json({ error: 'Invalid offset' });
  }
  const today = new Date();
  const shifted = addDays(today, Math.trunc(offset) * 7);
  const anchorMonday = mondayOfCalendarWeek(shifted);
  const ymd = `${anchorMonday.getFullYear()}-${String(anchorMonday.getMonth() + 1).padStart(2, '0')}-${String(anchorMonday.getDate()).padStart(2, '0')}`;
  const { rows } = await pool.query(
    `SELECT id, week_number, year, start_date::text
     FROM weeks
     WHERE start_date >= $1::date
     ORDER BY start_date ASC
     LIMIT 8`,
    [ymd]
  );
  res.json(rows);
});

module.exports = router;
