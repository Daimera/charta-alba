import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pointPurchases, pointsLedger } from "@/lib/db/schema";
import { stripe } from "@/lib/stripe";
import { and, eq, gte, sql } from "drizzle-orm";

const REFUND_WINDOW_HOURS = 48;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { purchaseId?: string };
  if (!body.purchaseId) return Response.json({ error: "purchaseId is required" }, { status: 400 });

  const [purchase] = await db
    .select()
    .from(pointPurchases)
    .where(
      and(
        eq(pointPurchases.id, body.purchaseId),
        eq(pointPurchases.userId, session.user.id)
      )
    )
    .limit(1);

  if (!purchase) return Response.json({ error: "Purchase not found" }, { status: 404 });
  if (purchase.status !== "completed") {
    return Response.json({ error: "Only completed purchases can be refunded" }, { status: 400 });
  }

  // 48-hour window check
  const purchaseAge = Date.now() - new Date(purchase.createdAt ?? 0).getTime();
  if (purchaseAge > REFUND_WINDOW_HOURS * 3600_000) {
    return Response.json({
      error: "Refund window expired — refunds are only available within 48 hours of purchase",
    }, { status: 400 });
  }

  // Check that purchased points have NOT been spent since purchase
  const [spentRow] = await db
    .select({ spent: sql<number>`COALESCE(SUM(ABS(${pointsLedger.amount})), 0)::int` })
    .from(pointsLedger)
    .where(
      and(
        eq(pointsLedger.userId, session.user.id),
        gte(pointsLedger.createdAt, purchase.createdAt ?? new Date(0).toISOString()),
        sql`${pointsLedger.amount} < 0`,
        sql`${pointsLedger.transactionType} != 'refund'`
      )
    );

  const totalSpentSincePurchase = spentRow?.spent ?? 0;
  if (totalSpentSincePurchase > 0) {
    return Response.json({
      error: "Refund unavailable — points have been spent. Refunds are only allowed before any points are used.",
    }, { status: 400 });
  }

  // Issue Stripe refund if payment ID exists
  if (stripe && purchase.stripePaymentId) {
    try {
      await stripe.refunds.create({ payment_intent: purchase.stripePaymentId });
    } catch (err) {
      console.error("[points/refund] Stripe refund failed:", err);
      return Response.json({ error: "Stripe refund failed — contact support@chartaalba.com" }, { status: 500 });
    }
  }

  // Mark purchase as refunded and reverse points in ledger
  await db
    .update(pointPurchases)
    .set({ status: "refunded" })
    .where(eq(pointPurchases.id, purchase.id));

  await db.insert(pointsLedger).values({
    userId: session.user.id,
    amount: -purchase.pointsAmount,
    transactionType: "refund",
    referenceId: purchase.id,
    description: `Refund: ${purchase.pointsAmount} pts reversed (purchase within 48h)`,
    isFlagged: false,
  });

  return Response.json({ ok: true, refundedPoints: purchase.pointsAmount });
}
