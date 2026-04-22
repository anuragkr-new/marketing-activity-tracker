const { verifyToken } = require('../lib/jwt');
const { pool } = require('../db/pool');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const m = header.match(/^Bearer\s+(.+)$/i);
  if (!m) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const payload = verifyToken(m[1]);
    req.auth = { userId: Number(payload.sub), role: payload.role };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.auth?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

/** Loads full user row onto req.dbUser */
async function attachDbUser(req, res, next) {
  try {
    const { rows } = await pool.query(
      'SELECT id, username, role FROM users WHERE id = $1',
      [req.auth.userId]
    );
    if (!rows[0]) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.dbUser = rows[0];
    next();
  } catch (e) {
    next(e);
  }
}

module.exports = { requireAuth, requireAdmin, attachDbUser };
