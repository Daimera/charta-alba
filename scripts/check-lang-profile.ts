import { neon } from "@neondatabase/serverless";

async function run() {
  const sql = neon(process.env.DATABASE_URL!);
  const p = await sql`SELECT id, username, preferred_language FROM profiles LIMIT 3`;
  console.log("profiles:", JSON.stringify(p, null, 2));
  const u = await sql`SELECT id, email FROM users LIMIT 3`;
  console.log("users:", JSON.stringify(u, null, 2));
  // Test the language update
  const pid = p[0]?.id;
  if (pid) {
    const r = await sql`UPDATE profiles SET preferred_language = 'es' WHERE id = ${pid} RETURNING id, preferred_language`;
    console.log("UPDATE result:", JSON.stringify(r));
    // Reset
    await sql`UPDATE profiles SET preferred_language = 'en' WHERE id = ${pid}`;
    console.log("reset done");
  }
}
run().catch(console.error);
