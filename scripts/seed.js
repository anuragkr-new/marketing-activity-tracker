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

/** Theme + initiative name (owner Apoorv for all). Names must stay ≤255 chars for DB. */
const DEFAULT_INITIATIVES = [
  { theme: 'Funnel Optimization', name: 'Improve Lead to MQL -- Debounce setup on demo and tool pages' },
  {
    theme: 'Funnel Optimization',
    name: 'Landing page revamps -- Contact Us, Blog homepage, Case Study, About Us, Events LP',
  },
  { theme: 'Funnel Optimization', name: 'Improve MQL to Demo -- Automated SDR and AE workflows' },
  { theme: 'Paid Marketing / ABM', name: 'Google Search Ads -- Brand, non-branded, competition' },
  { theme: 'Paid Marketing / ABM', name: 'Google Remarketing -- GD accounts visited website' },
  { theme: 'Paid Marketing / ABM', name: 'LinkedIn Static Ad Campaign' },
  { theme: 'Paid Marketing / ABM', name: "LinkedIn Message Campaign via Sanjay's handle" },
  { theme: 'Paid Marketing / ABM', name: 'GDs ABM -- LinkedIn and Google ads' },
  { theme: 'AEO', name: 'AEO activities tracking and brief' },
  { theme: 'AEO', name: 'Implement FAQs on 50 high-intent blog pages' },
  { theme: 'AEO', name: 'Track LLM prompt visibility with comparison reporting' },
  { theme: 'AEO', name: 'Reddit and Quora engagement' },
  { theme: 'SEO and Content', name: 'New and revamp blogs and LPs -- content production' },
  { theme: 'SEO and Content', name: 'BOFU articles -- 10 new articles via Claude' },
  { theme: 'SEO and Content', name: 'Build 15 high-authority backlinks per month' },
  { theme: 'SEO and Content', name: 'Keyword rankings tracking -- primary and secondary' },
  { theme: 'SEO and Content', name: 'Sunset and redirect unrequired pages' },
  { theme: 'SEO and Content', name: 'Tech SEO -- fix 404 pages' },
  { theme: 'Newsletter', name: 'LinkedIn newsletter -- rollout every Thursday' },
  { theme: 'Reporting', name: 'Daily MQL tracking' },
  { theme: 'Reporting', name: 'Homepage analysis post revamp' },
];

const DEFAULT_OWNER_NAME = 'Apoorv';

async function ensureMarketingInitiatives() {
  await pool.query(
    `INSERT INTO owners (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
    [DEFAULT_OWNER_NAME]
  );
  const { rows: ownerRows } = await pool.query(
    `SELECT id FROM owners WHERE name = $1`,
    [DEFAULT_OWNER_NAME]
  );
  const ownerId = ownerRows[0]?.id;
  if (!ownerId) {
    console.warn('Could not resolve owner id; skipping initiative seed.');
    return;
  }

  let inserted = 0;
  let skipped = 0;
  for (const row of DEFAULT_INITIATIVES) {
    const name = row.name.length > 255 ? row.name.slice(0, 252) + '...' : row.name;
    const { rows: th } = await pool.query(`SELECT id FROM themes WHERE name = $1`, [row.theme]);
    const themeId = th[0]?.id;
    if (!themeId) {
      console.warn(`Skipping initiative (missing theme): ${row.theme} — ${name}`);
      skipped += 1;
      continue;
    }
    const ins = await pool.query(
      `INSERT INTO initiatives (name, theme_id, owner_id, landing_page_url, status)
       SELECT $1, $2, $3, NULL, 'active'
       WHERE NOT EXISTS (
         SELECT 1 FROM initiatives i WHERE i.theme_id = $2 AND i.name = $1
       )
       RETURNING id`,
      [name, themeId, ownerId]
    );
    if (ins.rowCount > 0) inserted += 1;
    else skipped += 1;
  }
  console.log(
    `Marketing initiatives: ${inserted} inserted, ${skipped} skipped (duplicate theme+name or missing theme).`
  );
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
  await ensureMarketingInitiatives();
  await ensureWeeks();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
