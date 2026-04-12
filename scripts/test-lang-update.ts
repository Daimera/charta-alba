import { neon } from "@neondatabase/serverless";

async function run() {
  const sql = neon(process.env.DATABASE_URL!);
  const userId = "13ff1e1a-f56d-4638-a18a-d403c7a425fb";

  // Test direct UPDATE
  const r1 = await sql`UPDATE profiles SET preferred_language = 'es' WHERE id = ${userId}`;
  console.log("UPDATE result:", JSON.stringify(r1));

  // Verify
  const r2 = await sql`SELECT id, preferred_language FROM profiles WHERE id = ${userId}`;
  console.log("After UPDATE:", JSON.stringify(r2));

  // Reset
  await sql`UPDATE profiles SET preferred_language = 'en' WHERE id = ${userId}`;
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
