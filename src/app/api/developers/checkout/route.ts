import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiKeys, profiles, users } from "@/lib/db/schema";
import { stripe, STRIPE_PRICES } from "@/lib/stripe";
import { and, eq } from "drizzle-orm";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (!stripe) {
    return Response.json({ error: "Billing is not configured" }, { status: 503 });
  }

  const body = await req.json() as { tier?: string; keyId?: string };
  const { tier, keyId } = body;

  if (!tier || !["starter", "pro"].includes(tier)) {
    return Response.json({ error: "tier must be 'starter' or 'pro'" }, { status: 400 });
  }

  const priceId = STRIPE_PRICES[tier];
  if (!priceId) {
    return Response.json({ error: `Stripe price not configured for tier '${tier}'` }, { status: 503 });
  }

  // Resolve the API key to upgrade (optional — upgrade all user's keys if not specified)
  if (keyId) {
    const [key] = await db
      .select({ id: apiKeys.id })
      .from(apiKeys)
      .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, session.user.id)))
      .limit(1);
    if (!key) return Response.json({ error: "API key not found" }, { status: 404 });
  }

  // Get or create Stripe customer
  const [profile] = await db
    .select({ stripeCustomerId: profiles.stripeCustomerId })
    .from(profiles)
    .where(eq(profiles.id, session.user.id))
    .limit(1);

  const [user] = await db
    .select({ email: users.email, name: users.name })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  let customerId = profile?.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name ?? undefined,
      metadata: { userId: session.user.id },
    });
    customerId = customer.id;
    await db
      .insert(profiles)
      .values({ id: session.user.id, stripeCustomerId: customerId })
      .onConflictDoUpdate({ target: profiles.id, set: { stripeCustomerId: customerId } });
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "https://chartaalba.com";

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/developers/dashboard?success=upgraded&tier=${tier}`,
    cancel_url: `${baseUrl}/developers/dashboard`,
    metadata: {
      userId: session.user.id,
      tier,
      keyId: keyId ?? "",
    },
  });

  return Response.json({ url: checkoutSession.url });
}
