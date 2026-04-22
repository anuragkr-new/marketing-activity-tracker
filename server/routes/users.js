const express = require('express');
const bcrypt = require('bcrypt');
const { z } = require('zod');
const { pool } = require('../db/pool');
const { requireAuth, requireAdmin, attachDbUser } = require('../middleware/auth');

const router = express.Router();

const roleEnum = z.enum(['admin', 'member']);

router.use(requireAuth, attachDbUser, requireAdmin);

router.get('/', async (_req, res) => {
  const { rows } = await pool.query(
    'SELECT id, username, role, created_at FROM users ORDER BY username'
  );
  res.json(rows);
});

router.post('/', async (req, res) => {
  const body = z
    .object({
      username: z.string().min(1).max(100),
      password: z.string().min(1),
      role: roleEnum,
    })
    .parse(req.body);
  const password_hash = await bcrypt.hash(body.password, 10);
  const { rows } = await pool.query(
    `INSERT INTO users (username, password_hash, role)
     VALUES ($1, $2, $3)
     RETURNING id, username, role, created_at`,
    [body.username.trim(), password_hash, body.role]
  );
  res.status(201).json(rows[0]);
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  const body = z
    .object({
      username: z.string().min(1).max(100).optional(),
      password: z.string().min(1).optional(),
      role: roleEnum.optional(),
    })
    .parse(req.body);
  const fields = [];
  const vals = [];
  let i = 1;
  if (body.username != null) {
    fields.push(`username = $${i++}`);
    vals.push(body.username.trim());
  }
  if (body.password != null) {
    fields.push(`password_hash = $${i++}`);
    vals.push(await bcrypt.hash(body.password, 10));
  }
  if (body.role != null) {
    fields.push(`role = $${i++}`);
    vals.push(body.role);
  }
  if (fields.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }
  vals.push(id);
  const { rows } = await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${i}
     RETURNING id, username, role, created_at`,
    vals
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  if (id === req.dbUser.id) {
    return res.status(400).json({ error: 'Cannot remove yourself' });
  }
  await pool.query('UPDATE initiatives SET owner_id = NULL WHERE owner_id = $1', [
    id,
  ]);
  await pool.query('UPDATE activity_log SET updated_by = NULL WHERE updated_by = $1', [
    id,
  ]);
  const r = await pool.query('DELETE FROM users WHERE id = $1', [id]);
  if (r.rowCount === 0) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
});

module.exports = router;
