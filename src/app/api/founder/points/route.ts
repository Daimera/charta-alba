import { authenticateFounder } from "@/middleware/founderAuth";
import { db } from "@/lib/db";
import { pointsLedger, pointRules, users } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { logAudit, getRequestIp, getRequestUserAgent } from "@/lib/audit";

/** GET — full points ledger (recent 200 rows) or point_rules */
export async function GET(req: Request) {
  const fa = await authenticateFounder(req, 2);
  if (!fa.ok) return fa.response;

  const { searchParams } = new URL(req.url);
  const view = searchParams.get("view") ?? "ledger";

  if (view === "rules") {
    const rules = await db.select().from(pointRules).orderBy(pointRules.actionType);
    return Response.json({ rules });
  }

  // Full ledger with user details
  const rows = await db
    .select({
      id: pointsLedger.id,
      userId: pointsLedger.userId,
      amount: pointsLedger.amount,
      transactionType: pointsLedger.transactionType,
      description: pointsLedger.description,
      isFlagged: pointsLedger.isFlagged,
      ipAddress: pointsLedger.ipAddress,
      createdAt: pointsLedger.createdAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(pointsLedger)
    .leftJoin(users, eq(pointsLedger.userId, users.id))
    .orderBy(desc(pointsLedger.createdAt))
    .limit(200);

  // Aggregate stats
  const [stats] = await db
    .select({
      totalAwarded: sql<number>`COALESCE(SUM(CASE WHEN ${pointsLedger.amount} > 0 THEN ${pointsLedger.amount} ELSE 0 END), 0)::int`,
      totalVoided: sql<number>`COALESCE(SUM(CASE WHEN ${pointsLedger.amount} < 0 THEN ABS(${pointsLedger.amount}) ELSE 0 END), 0)::int`,
      flaggedCount: sql<number>`SUM(CASE WHEN ${pointsLedger.isFlagged} THEN 1 ELSE 0 END)::int`,
    })
    .from(pointsLedger);

  return Response.json({ rows, stats });
}

/** POST — award/void points or update point_rules (Level 3) */
export async function POST(req: Request) {
  const body = await req.json() as {
    action?: string;
    userId?: string;
    amount?: number;
    reason?: string;
    ledgerEntryId?: string;
    ruleId?: string;
    ruleUpdates?: Record<string, unknown>;
    confirmPhrase?: string;
  };
  const fa = await authenticateFounder(req, 3, body);
  if (!fa.ok) return fa.response;

  const ip = getRequestIp(req);
  const ua = getRequestUserAgent(req);

  if (body.action === "award") {
    if (!body.userId || !body.amount || body.amount <= 0 || !body.reason) {
      return Response.json({ error: "userId, amount > 0, and reason required" }, { status: 400 });
    }
    await db.insert(pointsLedger).values({
      userId: body.userId,
      amount: body.amount,
      transactionType: "admin_award",
      description: `Founder manual award: ${body.reason}`,
      isFlagged: false,
    });
    await logAudit({
      actionType: "founder_points_manual_award",
      targetType: "user", targetId: body.userId,
      detail: { amount: body.amount, reason: body.reason },
      ipAddress: ip, userAgent: ua, totpVerified: true, verificationLevel: 3,
    });
    return Response.json({ ok: true });
  }

  if (body.action === "void") {
    if (!body.ledgerEntryId || !body.reason) {
      return Response.json({ error: "ledgerEntryId and reason required" }, { status: 400 });
    }
    const [entry] = await db
      .select()
      .from(pointsLedger)
      .where(eq(pointsLedger.id, body.ledgerEntryId))
      .limit(1);
    if (!entry) return Response.json({ error: "Entry not found" }, { status: 404 });
    if (entry.amount < 0) return Response.json({ error: "Can only void positive entries" }, { status: 400 });

    await db.insert(pointsLedger).values({
      userId: entry.userId,
      amount: -entry.amount,
      transactionType: "admin_void",
      referenceId: entry.id,
      description: `Founder void: ${body.reason}`,
      isFlagged: false,
    });
    await logAudit({
      actionType: "founder_points_voided",
      targetType: "ledger_entry", targetId: body.ledgerEntryId,
      detail: { userId: entry.userId, amount: entry.amount, reason: body.reason },
      ipAddress: ip, userAgent: ua, totpVerified: true, verificationLevel: 3,
    });
    return Response.json({ ok: true, voided: entry.amount });
  }

  if (body.action === "freeze_earning") {
    if (!body.userId || !body.reason) {
      return Response.json({ error: "userId and reason required" }, { status: 400 });
    }
    // Insert a sentinel row that awardPoints() will detect
    await db.insert(pointsLedger).values({
      userId: body.userId,
      amount: 0,
      transactionType: "earning_frozen",
      description: `Founder froze earning: ${body.reason}`,
      isFlagged: true,
    });
    await logAudit({
      actionType: "founder_earning_frozen",
      targetType: "user", targetId: body.userId,
      detail: { reason: body.reason },
      ipAddress: ip, userAgent: ua, totpVerified: true, verificationLevel: 3,
    });
    return Response.json({ ok: true });
  }

  if (body.action === "update_rule") {
    if (!body.ruleId || !body.ruleUpdates) {
      return Response.json({ error: "ruleId and ruleUpdates required" }, { status: 400 });
    }
    const allowed = ["pointsAwarded", "dailyLimit", "weeklyLimit", "isActive", "description"];
    const safe = Object.fromEntries(
      Object.entries(body.ruleUpdates).filter(([k]) => allowed.includes(k)),
    );
    if (Object.keys(safe).length === 0) {
      return Response.json({ error: "No valid fields to update" }, { status: 400 });
    }
    await db.update(pointRules).set(safe).where(eq(pointRules.id, body.ruleId));
    await logAudit({
      actionType: "founder_point_rule_updated",
      targetType: "point_rule", targetId: body.ruleId,
      detail: safe,
      ipAddress: ip, userAgent: ua, totpVerified: true, verificationLevel: 3,
    });
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}
