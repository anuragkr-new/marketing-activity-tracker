-- Spyne activity tracker (themes, owners, initiatives.owner_id, activity_log)

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

CREATE TABLE IF NOT EXISTS owners (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO owners (name) VALUES ('Unknown') ON CONFLICT (name) DO NOTHING;

-- Fresh installs: initiatives reference owners
CREATE TABLE IF NOT EXISTS initiatives (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  theme_id INTEGER REFERENCES themes(id),
  owner_id INTEGER NOT NULL REFERENCES owners(id),
  landing_page_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Upgrade from pre-v2 schema: initiatives.owner_id -> users only (not owners)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'initiatives' AND column_name = 'owner_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
    WHERE tc.table_schema = 'public' AND tc.table_name = 'initiatives'
      AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = 'owner_id'
      AND ccu.table_name = 'users'
  ) THEN
    ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS owner VARCHAR(100);

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

-- Legacy v2: plain-text owner column -> owners table + owner_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'initiatives' AND column_name = 'owner'
  ) THEN
    ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS owner_id INTEGER REFERENCES owners(id);

    INSERT INTO owners (name)
    SELECT DISTINCT TRIM(i.owner)
    FROM initiatives i
    WHERE TRIM(COALESCE(i.owner, '')) != ''
    ON CONFLICT (name) DO NOTHING;

    INSERT INTO owners (name) VALUES ('Unknown') ON CONFLICT (name) DO NOTHING;

    UPDATE initiatives i
    SET owner_id = o.id
    FROM owners o
    WHERE TRIM(COALESCE(i.owner, '')) = o.name AND i.owner_id IS NULL;

    UPDATE initiatives
    SET owner_id = (SELECT id FROM owners WHERE name = 'Unknown' ORDER BY id LIMIT 1)
    WHERE owner_id IS NULL;

    ALTER TABLE initiatives ALTER COLUMN owner_id SET NOT NULL;
    ALTER TABLE initiatives DROP COLUMN owner;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS activity_log (
  id SERIAL PRIMARY KEY,
  initiative_id INTEGER REFERENCES initiatives(id),
  week_id INTEGER REFERENCES weeks(id),
  cell_text TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(initiative_id, week_id)
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'activity_log' AND column_name = 'worked_on'
  ) THEN
    ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS cell_text TEXT NOT NULL DEFAULT '';
    UPDATE activity_log SET cell_text = 'Yes' WHERE worked_on IS TRUE;
    ALTER TABLE activity_log DROP COLUMN worked_on;
  END IF;
END $$;

ALTER TABLE activity_log DROP CONSTRAINT IF EXISTS activity_log_updated_by_fkey;
ALTER TABLE activity_log DROP COLUMN IF EXISTS updated_by;

DROP TABLE IF EXISTS users CASCADE;
