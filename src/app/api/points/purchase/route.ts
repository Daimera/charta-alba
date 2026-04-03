import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, pointPurchases } from "@/lib/db/schema";
import { stripe } from "@/lib/stripe";
import { eq } from "drizzle-orm";

// Point packages: cents price → points amount
export const POINT_PACKAGES = {
  starter:  { points: 500,    priceUsd: 499,  label: "Starter Pack",  badge: null },
  explorer: { points: 1500,   priceUsd: 999,  label: "Explorer Pack", badge: "Best Value" },
  power:    { points: 5000,   priceUsd: 2499, label: "Power Pack",    badge: null },
  research: { points: 15000,  priceUsd: 5999, label: "Research Pack", badge: null },
} as const;

export type PackageKey = keyof typeof POINT_PACKAGES;

const PRICE_IDS: Record<PackageKey, string | undefined> = {
  starter:  process.env.STRIPE_POINTS_STARTER_PRICE_ID,
  explorer: process.env.STRIPE_POINTS_EXPLORER_PRICE_ID,
  power:    process.env.STRIPE_POINTS_POWER_PRICE_ID,
  research: process.env.STRIPE_POINTS_RESEARCH_PRICE_ID,
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (!stripe) return Response.json({ error: "Billing not configured" }, { status: 503 });

  const body = await req.json() as { package?: string };
  const pkg = body.package as PackageKey | undefined;

  if (!pkg || !POINT_PACKAGES[pkg]) {
    return Response.json({ error: "Invalid package. Choose: starter, explorer, power, research" }, { status: 400 });
  }

  const [user] = await db
    .select({ email: users.email, name: users.name })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) return Response.json({ error: "User not found" }, { status: 404 });

  const priceId = PRICE_IDS[pkg];
  const details = POINT_PACKAGES[pkg];

  // Create a pending purchase record first
  const [purchase] = await db
    .insert(pointPurchases)
    .values({
      userId: session.user.id,
      pointsAmount: details.points,
      priceUsd: details.priceUsd,
      status: "pending",
    })
    .returning({ id: pointPurchases.id });

  const baseUrl = process.env.NEXTAUTH_URL ?? "https://chartaalba.com";

  if (priceId) {
    // Stripe Checkout (one-time payment mode)
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/points?success=purchased&pkg=${pkg}`,
      cancel_url: `${baseUrl}/points`,
      metadata: {
        userId: session.user.id,
        purchaseId: purchase.id,
        package: pkg,
        pointsAmount: String(details.points),
      },
    });

    // Store session ID for webhook lookup
    await db
      .update(pointPurchases)
      .set({ stripeSessionId: checkoutSession.id })
      .where(eq(pointPurchases.id, purchase.id));

    return Response.json({ url: checkoutSession.url });
  }

  // Stripe not configured: for dev, grant points immediately
  if (process.env.NODE_ENV !== "production") {
    const { awardPurchasedPoints } = await import("@/lib/points");
    await awardPurchasedPoints({
      userId: session.user.id,
      amount: details.points,
      purchaseId: purchase.id,
      description: `${details.label} (${details.points} pts) — dev mode`,
    });
    await db
      .update(pointPurchases)
      .set({ status: "completed" })
      .where(eq(pointPurchases.id, purchase.id));
    return Response.json({ ok: true, devMode: true, points: details.points });
  }

  return Response.json({ error: "Stripe price not configured for this package" }, { status: 503 });
}
