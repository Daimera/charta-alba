import { neon } from "@neondatabase/serverless";

async function run() {
  const sql = neon(process.env.DATABASE_URL!);

  for (const table of ["circle_members", "circle_posts"]) {
    const cols = await sql`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = ${table} AND table_schema = 'public'
      ORDER BY ordinal_position
    `;
    console.log(`${table} columns:`, cols.map((c) => (c as { column_name: string }).column_name));
  }

  // Try inserting into circles to see the actual error
  try {
    const rows = await sql`SELECT id, name, owner_id, member_count FROM circles LIMIT 1`;
    console.log("circles row:", JSON.stringify(rows[0]));
  } catch (e) {
    console.error("circles query error:", e);
  }
}

run().catch(console.error);
