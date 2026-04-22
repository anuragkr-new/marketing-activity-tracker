const express = require('express');
const bcrypt = require('bcrypt');
const { pool } = require('../db/pool');
const { signToken } = require('../lib/jwt');
const { requireAuth, attachDbUser } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  const { rows } = await pool.query(
    'SELECT id, username, role, password_hash FROM users WHERE username = $1',
    [username]
  );
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = signToken({ id: user.id, role: user.role });
  res.json({
    token,
    user: { id: user.id, username: user.username, role: user.role },
  });
});

router.get('/me', requireAuth, attachDbUser, (req, res) => {
  res.json({
    id: req.dbUser.id,
    username: req.dbUser.username,
    role: req.dbUser.role,
  });
});

module.exports = router;
