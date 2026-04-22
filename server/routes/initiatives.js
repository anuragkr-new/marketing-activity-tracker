const express = require('express');
const { z } = require('zod');
const { pool } = require('../db/pool');

const router = express.Router();

const listSelect = `
  SELECT i.id, i.name, i.theme_id, i.owner_id, o.name AS owner, i.landing_page_url, i.status, i.created_at,
         t.name AS theme_name
  FROM initiatives i
  LEFT JOIN themes t ON t.id = i.theme_id
  LEFT JOIN owners o ON o.id = i.owner_id
`;

router.get('/', async (_req, res) => {
  const { rows } = await pool.query(
    `${listSelect} ORDER BY t.name NULLS LAST, i.name`
  );
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  const { rows } = await pool.query(`${listSelect} WHERE i.id = $1`, [id]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

router.post('/', async (req, res) => {
  const body = z
    .object({
      name: z.string().min(1).max(255),
      theme_id: z.number().int().positive(),
      owner_id: z.number().int().positive(),
      landing_page_url: z
        .preprocess(
          (v) => (v === '' || v === undefined ? null : v),
          z.union([z.string().url(), z.null()])
        )
        .optional(),
    })
    .parse(req.body);
  const { rows } = await pool.query(
    `INSERT INTO initiatives (name, theme_id, owner_id, landing_page_url, status)
     VALUES ($1, $2, $3, $4, 'active')
     RETURNING id, name, theme_id, owner_id, landing_page_url, status, created_at`,
    [body.name.trim(), body.theme_id, body.owner_id, body.landing_page_url || null]
  );
  const full = await pool.query(`${listSelect} WHERE i.id = $1`, [rows[0].id]);
  res.status(201).json(full.rows[0]);
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  const body = z
    .object({
      name: z.string().min(1).max(255).optional(),
      theme_id: z.number().int().positive().optional().nullable(),
      owner_id: z.number().int().positive().optional(),
      landing_page_url: z.string().url().optional().nullable().or(z.literal('')),
      status: z.enum(['active', 'completed']).optional(),
    })
    .parse(req.body);
  const fields = [];
  const vals = [];
  let i = 1;
  if (body.name != null) {
    fields.push(`name = $${i++}`);
    vals.push(body.name.trim());
  }
  if (body.theme_id !== undefined) {
    fields.push(`theme_id = $${i++}`);
    vals.push(body.theme_id);
  }
  if (body.owner_id != null) {
    fields.push(`owner_id = $${i++}`);
    vals.push(body.owner_id);
  }
  if (body.landing_page_url !== undefined) {
    fields.push(`landing_page_url = $${i++}`);
    vals.push(
      body.landing_page_url === '' || body.landing_page_url == null
        ? null
        : body.landing_page_url
    );
  }
  if (body.status != null) {
    fields.push(`status = $${i++}`);
    vals.push(body.status);
  }
  if (fields.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }
  vals.push(id);
  const { rows } = await pool.query(
    `UPDATE initiatives SET ${fields.join(', ')} WHERE id = $${i} RETURNING id`,
    vals
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  const full = await pool.query(`${listSelect} WHERE i.id = $1`, [id]);
  res.json(full.rows[0]);
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  await pool.query('DELETE FROM activity_log WHERE initiative_id = $1', [id]);
  const r = await pool.query('DELETE FROM initiatives WHERE id = $1', [id]);
  if (r.rowCount === 0) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
});

module.exports = router;
