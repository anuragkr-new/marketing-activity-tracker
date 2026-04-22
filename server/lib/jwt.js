const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = '7d';

function signToken(user) {
  if (!SECRET) throw new Error('JWT_SECRET is not set');
  return jwt.sign({ sub: user.id, role: user.role }, SECRET, {
    expiresIn: EXPIRES_IN,
  });
}

function verifyToken(token) {
  if (!SECRET) throw new Error('JWT_SECRET is not set');
  return jwt.verify(token, SECRET);
}

module.exports = { signToken, verifyToken, EXPIRES_IN };
