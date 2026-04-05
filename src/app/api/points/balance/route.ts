import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pointsLedger, pointRules, profiles } from "@/lib/db/schema";
import { getBalance } from "@/lib/points";
import { eq, desc, sql } from "drizzle-orm";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const historyLimit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

  const [balance, history, rules, profileRow] = await Promise.all([
    getBalance(session.user.id),
    db
      .select({
        id: pointsLedger.id,
        amount: pointsLedger.amount,
        transactionType: pointsLedger.transactionType,
        referenceId: pointsLedger.referenceId,
        description: pointsLedger.description,
        createdAt: pointsLedger.createdAt,
      })
      .from(pointsLedger)
      .where(eq(pointsLedger.userId, session.user.id))
      .orderBy(desc(pointsLedger.createdAt))
      .limit(historyLimit),
    db.select().from(pointRules).where(eq(pointRules.isActive, true)),
    db
      .select({ subscriptionTier: profiles.subscriptionTier })
      .from(profiles)
      .where(eq(profiles.id, session.user.id))
      .limit(1),
  ]);

  // Compute running balance for each history row (descending order, so reverse)
  let running = balance;
  const historyWithRunning = history.map((row) => {
    const runningBefore = running;
    running -= row.amount; // unwind: balance before this transaction
    return { ...row, runningBalance: runningBefore };
  });

  return Response.json({
    balance,
    history: historyWithRunning,
    rules,
    tier: profileRow[0]?.subscriptionTier ?? "free",
  });
}
