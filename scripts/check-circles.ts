import { neon } from "@neondatabase/serverless";

async function run() {
  const sql = neon(process.env.DATABASE_URL!);

  const cols = await sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'circles' AND table_schema = 'public'
    ORDER BY ordinal_position
  `;
  console.log("circles columns:", JSON.stringify(cols, null, 2));

  const rows = await sql`SELECT id, name FROM circles LIMIT 3`;
  console.log("circles rows:", JSON.stringify(rows, null, 2));
}

run().catch(console.error);
