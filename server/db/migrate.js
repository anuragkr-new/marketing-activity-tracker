const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const fs = require('fs');
const { pool } = require('./pool');

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, 'migrate.sql'), 'utf8');
  await pool.query(sql);
  console.log('Migration completed.');
  await pool.end();
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
