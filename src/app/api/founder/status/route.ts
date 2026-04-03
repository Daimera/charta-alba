import { authenticateFounder } from "@/middleware/founderAuth";
import { db } from "@/lib/db";
import { users, papers, cards, apiKeys, pointsLedger, auditLog } from "@/lib/db/schema";
import { sql, and, gte, eq } from "drizzle-orm";

export async function GET(req: Request) {
  const fa = await authenticateFounder(req, 2);
  if (!fa.ok) return fa.response;

  const now = new Date();
  const dayAgo = new Date(now.getTime() - 86400_000).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    [userStats],
    [paperStats],
    [apiKeyStats],
    [pointStats],
    [failedLogins],
    [suspiciousFlags],
  ] = await Promise.all([
    db.select({
      total: sql<number>`COUNT(*)::int`,
    }).from(users),

    db.select({
      total: sql<number>`COUNT(*)::int`,
    }).from(papers),

    db.select({
      total: sql<number>`COUNT(*)::int`,
      active: sql<number>`SUM(CASE WHEN ${apiKeys.isActive} THEN 1 ELSE 0 END)::int`,
    }).from(apiKeys),

    db.select({
      totalAwarded: sql<number>`COALESCE(SUM(CASE WHEN ${pointsLedger.amount} > 0 THEN ${pointsLedger.amount} ELSE 0 END), 0)::int`,
      totalPurchased: sql<number>`COALESCE(SUM(CASE WHEN ${pointsLedger.transactionType} = 'purchase' THEN ${pointsLedger.amount} ELSE 0 END), 0)::int`,
    }).from(pointsLedger),

    db.select({
      count: sql<number>`COUNT(*)::int`,
    })
      .from(auditLog)
      .where(
        and(
          eq(auditLog.actionType, "founder_totp_failed"),
          gte(auditLog.createdAt, dayAgo),
        ),
      ),

    db.select({
      count: sql<number>`COUNT(*)::int`,
    })
      .from(pointsLedger)
      .where(eq(pointsLedger.isFlagged, true)),
  ]);

  return Response.json({
    users: { total: userStats?.total ?? 0 },
    papers: { total: paperStats?.total ?? 0 },
    apiKeys: {
      total: apiKeyStats?.total ?? 0,
      active: apiKeyStats?.active ?? 0,
    },
    points: {
      totalAwarded: pointStats?.totalAwarded ?? 0,
      totalPurchased: pointStats?.totalPurchased ?? 0,
    },
    security: {
      failedLoginsLast24h: failedLogins?.count ?? 0,
      suspiciousPointFlags: suspiciousFlags?.count ?? 0,
    },
    generatedAt: now.toISOString(),
  });
}
