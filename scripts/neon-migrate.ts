import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function run() {
  const tables = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='public'
    AND table_name IN ('circles','circle_members','circle_posts','circle_messages','circle_media')
  `;
  console.log("existing:", tables.map((t) => (t as { table_name: string }).table_name));

  await sql`CREATE TABLE IF NOT EXISTS circles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    topics text[],
    is_public boolean DEFAULT true,
    owner_id text REFERENCES users(id) ON DELETE CASCADE,
    member_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
  )`;
  console.log("circles ok");

  await sql`CREATE TABLE IF NOT EXISTS circle_members (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    circle_id uuid REFERENCES circles(id) ON DELETE CASCADE,
    user_id text REFERENCES users(id) ON DELETE CASCADE,
    role text DEFAULT 'member',
    joined_at timestamptz DEFAULT now(),
    UNIQUE(circle_id, user_id)
  )`;
  console.log("circle_members ok");

  await sql`CREATE TABLE IF NOT EXISTS circle_posts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    circle_id uuid REFERENCES circles(id) ON DELETE CASCADE,
    card_id uuid REFERENCES cards(id) ON DELETE CASCADE,
    posted_by text REFERENCES users(id),
    created_at timestamptz DEFAULT now()
  )`;
  console.log("circle_posts ok");

  await sql`CREATE TABLE IF NOT EXISTS circle_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    circle_id uuid REFERENCES circles(id) ON DELETE CASCADE,
    user_id text REFERENCES users(id) ON DELETE CASCADE,
    content text NOT NULL,
    message_type text DEFAULT 'text',
    media_url text,
    created_at timestamptz DEFAULT now()
  )`;
  console.log("circle_messages ok");

  await sql`CREATE TABLE IF NOT EXISTS circle_media (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    circle_id uuid REFERENCES circles(id) ON DELETE CASCADE,
    user_id text REFERENCES users(id) ON DELETE CASCADE,
    media_type text NOT NULL,
    media_url text NOT NULL,
    title text,
    created_at timestamptz DEFAULT now()
  )`;
  console.log("circle_media ok");

  console.log("migration complete");
}

run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
