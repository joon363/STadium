import pg from 'pg';

const { Client } = pg;
const connectionString = 'postgresql://postgres.rfqaufojzfgviggogyop:postechstudent26@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const sql = `
CREATE TABLE IF NOT EXISTS public.booths (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  operator TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'experience',
  description TEXT DEFAULT '',
  operating_hours TEXT DEFAULT '',
  icon TEXT DEFAULT '🎪',
  image_url TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sponsors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'gold',
  logo_url TEXT DEFAULT '',
  description TEXT DEFAULT '',
  website_url TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.food_trucks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  menu_summary TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '기계동 잔디밭 푸드트럭존',
  operating_hours TEXT DEFAULT '11:00 ~ 21:00',
  icon TEXT DEFAULT '🚚',
  image_url TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.booths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_trucks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'booths_public_select') THEN
    CREATE POLICY booths_public_select ON public.booths FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'booths_public_all') THEN
    CREATE POLICY booths_public_all ON public.booths FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'sponsors_public_select') THEN
    CREATE POLICY sponsors_public_select ON public.sponsors FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'sponsors_public_all') THEN
    CREATE POLICY sponsors_public_all ON public.sponsors FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'food_trucks_public_select') THEN
    CREATE POLICY food_trucks_public_select ON public.food_trucks FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'food_trucks_public_all') THEN
    CREATE POLICY food_trucks_public_all ON public.food_trucks FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
`;

async function run() {
  try {
    console.log('Connecting to Supabase PostgreSQL database...');
    await client.connect();
    console.log('Connected! Executing DDL migration queries...');
    await client.query(sql);
    console.log('🎉 SUCCESS: Migration SQL executed successfully on Supabase DB!');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await client.end();
  }
}

run();
