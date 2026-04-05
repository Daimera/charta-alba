import { authenticateFounder } from "@/middleware/founderAuth";
import { db } from "@/lib/db";
import { submissions } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET(req: Request) {
  const fa = await authenticateFounder(req, 1);
  if (!fa.ok) return fa.response;

  const rows = await db
    .select()
    .from(submissions)
    .orderBy(desc(submissions.createdAt))
    .limit(200);

  return Response.json({ submissions: rows });
}
