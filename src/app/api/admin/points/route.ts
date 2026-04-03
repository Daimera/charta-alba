import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pointsLedger, users } from "@/lib/db/schema";
import { and, desc, eq, gte, sql } from "drizzle-orm";

function requireAdmin(session: { user?: { id?: string; role?: string } } | null) {
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

export async function GET(req: Request) {
  const session = await auth();
  const err = requireAdmin(session);
  if (err) return err;

  const { searchParams } = new URL(req.url);
  const view = searchParams.get("view") ?? "flagged";

  if (view === "flagged") {
    const flagged = await db
      .select({
        id: pointsLedger.id,
        userId: pointsLedger.userId,
        amount: pointsLedger.amount,
        transactionType: pointsLedger.transactionType,
        referenceId: pointsLedger.referenceId,
        description: pointsLedger.description,
        ipAddress: pointsLedger.ipAddress,
        createdAt: pointsLedger.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(pointsLedger)
      .leftJoin(users, eq(pointsLedger.userId, users.id))
      .where(eq(pointsLedger.isFlagged, true))
      .orderBy(desc(pointsLedger.createdAt))
      .limit(200);

    return Response.json({ flagged });
  }

  if (view === "velocity") {
    // Users who earned >500 pts in last hour
    const hourAgo = new Date(Date.now() - 3600_000).toISOString();
    const suspicious = await db
      .select({
        userId: pointsLedger.userId,
        totalPts: sql<number>`SUM(${pointsLedger.amount})::int`,
        eventCount: sql<number>`COUNT(*)::int`,
        userName: users.name,
        userEmail: users.email,
      })
      .from(pointsLedger)
      .leftJoin(users, eq(pointsLedger.userId, users.id))
      .where(and(gte(pointsLedger.createdAt, hourAgo), sql`${pointsLedger.amount} > 0`))
      .groupBy(pointsLedger.userId, users.name, users.email)
      .having(sql`SUM(${pointsLedger.amount}) > 500`)
      .orderBy(desc(sql`SUM(${pointsLedger.amount})`));

    return Response.json({ suspicious });
  }

  return Response.json({ error: "Unknown view" }, { status: 400 });
}

/** POST — void fraudulent points by inserting an offsetting negative entry. */
export async function POST(req: Request) {
  const session = await auth();
  const err = requireAdmin(session);
  if (err) return err;

  const body = await req.json() as {
    action?: string;
    ledgerEntryId?: string;
    userId?: string;
    amount?: number;
    reason?: string;
  };

  if (body.action === "void_entry") {
    if (!body.ledgerEntryId || !body.reason) {
      return Response.json({ error: "ledgerEntryId and reason required" }, { status: 400 });
    }

    const [entry] = await db
      .select()
      .from(pointsLedger)
      .where(eq(pointsLedger.id, body.ledgerEntryId))
      .limit(1);

    if (!entry) return Response.json({ error: "Ledger entry not found" }, { status: 404 });
    if (entry.amount < 0) return Response.json({ error: "Can only void positive entries" }, { status: 400 });

    // Insert correcting entry (never delete — audit trail preserved)
    await db.insert(pointsLedger).values({
      userId: entry.userId,
      amount: -entry.amount,
      transactionType: "admin_void",
      referenceId: entry.id,
      description: `Admin void: ${body.reason}`,
      isFlagged: false,
    });

    return Response.json({ ok: true, voided: entry.amount });
  }

  if (body.action === "void_user_points") {
    if (!body.userId || !body.amount || !body.reason) {
      return Response.json({ error: "userId, amount, and reason required" }, { status: 400 });
    }

    await db.insert(pointsLedger).values({
      userId: body.userId,
      amount: -Math.abs(body.amount),
      transactionType: "admin_void",
      referenceId: null,
      description: `Admin void: ${body.reason}`,
      isFlagged: false,
    });

    return Response.json({ ok: true });
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}
