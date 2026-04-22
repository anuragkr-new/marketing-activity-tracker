require('dotenv').config({ path: require('path').join(__dirname, '..', 'server', '.env') });
const bcrypt = require('bcrypt');
const { pool } = require('../server/db/pool');
const {
  allWeekRowsForSeedYears,
} = require('../server/lib/isoWeek');

async function ensureAdmin() {
  const { rows } = await pool.query(
    "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
  );
  if (rows.length > 0) {
    console.log('Admin user already exists; skipping admin creation.');
    return;
  }
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) {
    console.error(
      'Missing ADMIN_USERNAME or ADMIN_PASSWORD in environment. Set them in server/.env for first seed.'
    );
    process.exit(1);
  }
  const password_hash = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO users (username, password_hash, role) VALUES ($1, $2, 'admin')`,
    [username, password_hash]
  );
  console.log('Created admin user.');
}

async function ensureWeeks() {
  const y = new Date().getFullYear();
  const rows = allWeekRowsForSeedYears(y, y + 1);
  for (const r of rows) {
    const ymd = `${r.start_date.getFullYear()}-${String(r.start_date.getMonth() + 1).padStart(2, '0')}-${String(r.start_date.getDate()).padStart(2, '0')}`;
    await pool.query(
      `INSERT INTO weeks (week_number, year, start_date)
       VALUES ($1, $2, $3::date)
       ON CONFLICT (week_number, year) DO NOTHING`,
      [r.week_number, r.year, ymd]
    );
  }
  console.log(`Seeded weeks for ${y} and ${y + 1}.`);
}

async function main() {
  await ensureAdmin();
  await ensureWeeks();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
