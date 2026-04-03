import { authenticateFounder } from "@/middleware/founderAuth";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";
import { desc, gte, eq, and } from "drizzle-orm";

export async function GET(req: Request) {
  const fa = await authenticateFounder(req, 2);
  if (!fa.ok) return fa.response;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "100"), 500);
  const since = searchParams.get("since");
  const actionType = searchParams.get("type");

  const conditions = [];
  if (since) conditions.push(gte(auditLog.createdAt, since));
  if (actionType) conditions.push(eq(auditLog.actionType, actionType));

  const rows = await db
    .select()
    .from(auditLog)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(auditLog.createdAt))
    .limit(limit);

  return Response.json({ rows, total: rows.length });
}
