import { db } from "@/lib/db";
import { pointPurchases } from "@/lib/db/schema";
import { awardPurchasedPoints } from "@/lib/points";
import { stripe } from "@/lib/stripe";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { POINT_PACKAGES, type PackageKey } from "@/app/api/points/purchase/route";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!stripe) return Response.json({ error: "Stripe not configured" }, { status: 503 });

  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_POINTS_WEBHOOK_SECRET
    ?? process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return Response.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return Response.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const userId = session.metadata?.userId;
    const purchaseId = session.metadata?.purchaseId;
    const pkg = session.metadata?.package as PackageKey | undefined;
    const pointsAmount = parseInt(session.metadata?.pointsAmount ?? "0");

    if (!userId || !purchaseId || !pointsAmount) return Response.json({ ok: true });

    const paymentIntentId = typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

    // Mark purchase as completed
    await db
      .update(pointPurchases)
      .set({ status: "completed", stripePaymentId: paymentIntentId })
      .where(eq(pointPurchases.id, purchaseId));

    // Award points
    const label = pkg ? POINT_PACKAGES[pkg]?.label : "Point purchase";
    await awardPurchasedPoints({
      userId,
      amount: pointsAmount,
      purchaseId,
      description: `${label ?? "Points"} (${pointsAmount} pts purchased)`,
    });
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    const paymentIntentId = typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : null;

    if (paymentIntentId) {
      const [purchase] = await db
        .select()
        .from(pointPurchases)
        .where(eq(pointPurchases.stripePaymentId, paymentIntentId))
        .limit(1);

      if (purchase && purchase.status === "completed") {
        await db
          .update(pointPurchases)
          .set({ status: "refunded" })
          .where(eq(pointPurchases.id, purchase.id));

        // Insert negative ledger entry for the refunded points
        const { spendPoints } = await import("@/lib/points");
        await spendPoints({
          userId: purchase.userId,
          amount: purchase.pointsAmount,
          spendType: "refund",
          referenceId: purchase.id,
          description: `Refund: ${purchase.pointsAmount} pts reversed`,
        });
      }
    }
  }

  return Response.json({ ok: true });
}
