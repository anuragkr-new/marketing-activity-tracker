-- Spyne activity tracker v2 (open API, owner text, no user attribution on activity)

CREATE TABLE IF NOT EXISTS themes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weeks (
  id SERIAL PRIMARY KEY,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  start_date DATE NOT NULL,
  UNIQUE(week_number, year)
);

-- Fresh installs: initiatives with plain-text owner
CREATE TABLE IF NOT EXISTS initiatives (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  theme_id INTEGER REFERENCES themes(id),
  owner VARCHAR(100) NOT NULL DEFAULT '',
  landing_page_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Upgrade from pre-v2 schema (owner_id + users)
ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS owner VARCHAR(100);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'initiatives' AND column_name = 'owner_id'
  ) THEN
    UPDATE initiatives i
    SET owner = COALESCE(
      (SELECT u.username FROM users u WHERE u.id = i.owner_id),
      NULLIF(TRIM(i.owner), ''),
      'Unknown'
    )
    WHERE owner IS NULL OR TRIM(COALESCE(owner, '')) = '';

    UPDATE initiatives SET owner = 'Unknown' WHERE owner IS NULL OR TRIM(owner) = '';

    ALTER TABLE initiatives DROP CONSTRAINT IF EXISTS initiatives_owner_id_fkey;
    ALTER TABLE initiatives DROP COLUMN IF EXISTS owner_id;
  END IF;
END $$;

UPDATE initiatives SET owner = 'Unknown' WHERE owner IS NULL;

ALTER TABLE initiatives ALTER COLUMN owner SET NOT NULL;
ALTER TABLE initiatives ALTER COLUMN owner SET DEFAULT '';

CREATE TABLE IF NOT EXISTS activity_log (
  id SERIAL PRIMARY KEY,
  initiative_id INTEGER REFERENCES initiatives(id),
  week_id INTEGER REFERENCES weeks(id),
  worked_on BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(initiative_id, week_id)
);

ALTER TABLE activity_log DROP CONSTRAINT IF EXISTS activity_log_updated_by_fkey;
ALTER TABLE activity_log DROP COLUMN IF EXISTS updated_by;

DROP TABLE IF EXISTS users CASCADE;
