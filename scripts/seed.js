const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', 'server', '.env') });
const { pool } = require('../server/db/pool');
const { allMondaysOverlappingYear } = require('../server/lib/isoWeek');

const DEFAULT_THEMES = [
  'Funnel Optimization',
  'Paid Marketing / ABM',
  'AEO',
  'SEO and Content',
  'Newsletter',
  'Reporting',
  'Trust Library',
  'Objection Library',
  'Dealer Campaigns',
  'Product Campaigns',
  'Event Campaigns',
];

async function ensureThemes() {
  for (const name of DEFAULT_THEMES) {
    await pool.query(
      `INSERT INTO themes (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
      [name]
    );
  }
  console.log(`Ensured ${DEFAULT_THEMES.length} default themes (skipped if name already exists).`);
}

async function ensureWeeks() {
  const y = new Date().getFullYear();
  const rows = allMondaysOverlappingYear(y);
  for (const r of rows) {
    const ymd = `${r.start_date.getFullYear()}-${String(r.start_date.getMonth() + 1).padStart(2, '0')}-${String(r.start_date.getDate()).padStart(2, '0')}`;
    await pool.query(
      `INSERT INTO weeks (week_number, year, start_date)
       VALUES ($1, $2, $3::date)
       ON CONFLICT (week_number, year) DO NOTHING`,
      [r.week_number, r.year, ymd]
    );
  }
  console.log(`Seeded weeks for calendar year ${y} (ISO weeks overlapping that year).`);
}

async function main() {
  await ensureThemes();
  await ensureWeeks();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
