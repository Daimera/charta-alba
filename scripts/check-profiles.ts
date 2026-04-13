import { neon } from "@neondatabase/serverless";

async function run() {
  const sql = neon(process.env.DATABASE_URL!);

  const r = await sql`SELECT id, preferred_language FROM profiles LIMIT 5`;
  console.log("profiles rows:", JSON.stringify(r, null, 2));

  // Also check columns
  const cols = await sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'profiles' AND table_schema = 'public'
    ORDER BY ordinal_position
  `;
  console.log("profiles columns:", JSON.stringify(cols, null, 2));
}

run().catch(console.error);
