import { neon } from "@neondatabase/serverless";

async function run() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS circles (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        name text NOT NULL,
        description text,
        topics text[],
        is_public boolean DEFAULT true,
        owner_id uuid REFERENCES users(id) ON DELETE CASCADE,
        created_at timestamptz DEFAULT now()
      )
    `;
    console.log("✓ circles table ready");

    await sql`
      CREATE TABLE IF NOT EXISTS circle_members (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        circle_id uuid REFERENCES circles(id) ON DELETE CASCADE,
        user_id uuid REFERENCES users(id) ON DELETE CASCADE,
        role text DEFAULT 'member',
        joined_at timestamptz DEFAULT now(),
        UNIQUE(circle_id, user_id)
      )
    `;
    console.log("✓ circle_members table ready");

    await sql`
      CREATE TABLE IF NOT EXISTS circle_posts (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        circle_id uuid REFERENCES circles(id) ON DELETE CASCADE,
        card_id uuid REFERENCES cards(id) ON DELETE CASCADE,
        posted_by uuid REFERENCES users(id),
        created_at timestamptz DEFAULT now()
      )
    `;
    console.log("✓ circle_posts table ready");

    console.log("Circles migration applied successfully");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

run();
