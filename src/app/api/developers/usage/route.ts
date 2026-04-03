import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiKeys, apiUsageLogs } from "@/lib/db/schema";
import { eq, gte, inArray, sql } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userKeys = await db
    .select({ id: apiKeys.id, requestsThisMonth: apiKeys.requestsThisMonth })
    .from(apiKeys)
    .where(eq(apiKeys.userId, session.user.id));

  if (userKeys.length === 0) return Response.json({ days: [], totalThisMonth: 0 });

  const keyIds = userKeys.map((k) => k.id);
  const totalThisMonth = userKeys.reduce((s, k) => s + k.requestsThisMonth, 0);
  const since = new Date(Date.now() - 30 * 86400 * 1000).toISOString();

  const rows = await db
    .select({
      day: sql<string>`DATE(${apiUsageLogs.createdAt})::text`,
      requests: sql<number>`COUNT(*)::int`,
    })
    .from(apiUsageLogs)
    .where(
      sql`${apiUsageLogs.createdAt} >= ${since} AND ${apiUsageLogs.apiKeyId} = ANY(${sql.raw(`ARRAY[${keyIds.map((id) => `'${id}'`).join(",")}]::uuid[]`)})`
    )
    .groupBy(sql`DATE(${apiUsageLogs.createdAt})`)
    .orderBy(sql`DATE(${apiUsageLogs.createdAt})`);

  // Fill missing days with 0 for a full 30-day window
  const dayMap = new Map<string, number>(rows.map((r) => [r.day, r.requests]));
  const days: { day: string; requests: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400 * 1000).toISOString().slice(0, 10);
    days.push({ day: d, requests: dayMap.get(d) ?? 0 });
  }

  void inArray; // imported for future use

  return Response.json({ days, totalThisMonth });
}
