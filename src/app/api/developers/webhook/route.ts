import { db } from "@/lib/db";
import { apiKeys, profiles } from "@/lib/db/schema";
import { stripe } from "@/lib/stripe";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!stripe) {
    return Response.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return Response.json({ error: "Missing signature or webhook secret" }, { status: 400 });
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
    const tier = session.metadata?.tier as string | undefined;
    const keyId = session.metadata?.keyId;

    if (!userId || !tier) {
      return Response.json({ ok: true }); // not our session
    }

    const subscriptionId = typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;

    if (keyId) {
      // Upgrade specific key
      await db
        .update(apiKeys)
        .set({ tier, stripeSubscriptionId: subscriptionId })
        .where(eq(apiKeys.id, keyId));
    } else {
      // Upgrade all active keys for this user
      await db
        .update(apiKeys)
        .set({ tier, stripeSubscriptionId: subscriptionId })
        .where(eq(apiKeys.userId, userId));
    }

    // Store customer ID on profile if not already set
    if (session.customer) {
      const customerId = typeof session.customer === "string" ? session.customer : session.customer.id;
      await db
        .insert(profiles)
        .values({ id: userId, stripeCustomerId: customerId })
        .onConflictDoUpdate({ target: profiles.id, set: { stripeCustomerId: customerId } });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

    // Find user by customer ID and downgrade to free
    const [profile] = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.stripeCustomerId, customerId))
      .limit(1);

    if (profile) {
      await db
        .update(apiKeys)
        .set({ tier: "free", stripeSubscriptionId: null })
        .where(eq(apiKeys.userId, profile.id));
    }
  }

  return Response.json({ ok: true });
}
