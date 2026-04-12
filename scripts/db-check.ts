import { neon } from "@neondatabase/serverless";

async function run() {
  const sql = neon(process.env.DATABASE_URL!);

  const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles' ORDER BY ordinal_position`;
  console.log("profiles columns:", cols.map((r: Record<string, unknown>) => r.column_name).join(", "));

  const rows = await sql`SELECT * FROM profiles WHERE id = '13ff1e1a-f56d-4638-a18a-d403c7a425fb' LIMIT 1`;
  console.log("by id:", JSON.stringify(rows));

  const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('circles','circle_members','circle_posts')`;
  console.log("circle tables:", JSON.stringify(tables));
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
