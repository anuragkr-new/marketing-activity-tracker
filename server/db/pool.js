const { Pool } = require('pg');

const conn = process.env.DATABASE_URL || '';
const wantsSsl =
  /sslmode=require|sslmode=verify-full|ssl=true/i.test(conn) ||
  process.env.PGSSLMODE === 'require' ||
  process.env.FORCE_PG_SSL === 'true';

const pool = new Pool({
  connectionString: conn || undefined,
  ssl: wantsSsl ? { rejectUnauthorized: false } : undefined,
});

module.exports = { pool };
