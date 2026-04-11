import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

async function run() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS circles (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      name text NOT NULL,
      description text,
      topics text[],
      is_public boolean DEFAULT true,
      owner_id uuid REFERENCES users(id) ON DELETE CASCADE,
      created_at timestamptz DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS circle_members (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      circle_id uuid REFERENCES circles(id) ON DELETE CASCADE,
      user_id uuid REFERENCES users(id) ON DELETE CASCADE,
      role text DEFAULT 'member',
      joined_at timestamptz DEFAULT now(),
      UNIQUE(circle_id, user_id)
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS circle_posts (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      circle_id uuid REFERENCES circles(id) ON DELETE CASCADE,
      card_id uuid REFERENCES cards(id) ON DELETE CASCADE,
      posted_by uuid REFERENCES users(id),
      created_at timestamptz DEFAULT now()
    )
  `);
  console.log("Circles migration applied");
}

run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
