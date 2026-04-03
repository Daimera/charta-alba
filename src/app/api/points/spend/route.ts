import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { spendPoints } from "@/lib/points";
import { eq } from "drizzle-orm";

// Spendable items with their point costs
export const SPEND_ITEMS = {
  api_credits_500:     { points: 1000,  description: "500 extra API requests" },
  api_credits_3000:    { points: 5000,  description: "3,000 extra API requests" },
  boost_post_24h:      { points: 500,   description: "Boost post to top of feed for 24 hours" },
  badge_color_month:   { points: 200,   description: "Custom profile badge color (1 month)" },
  extended_ask_ai:     { points: 300,   description: "50 extra Ask AI questions (1 month)" },
  early_access_month:  { points: 1000,  description: "Early access to new features (1 month)" },
  remove_ads_month:    { points: 400,   description: "Remove ads for 1 month" },
} as const;

export type SpendItemKey = keyof typeof SPEND_ITEMS;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { item?: string; referenceId?: string; badgeColor?: string };
  const item = body.item as SpendItemKey | undefined;

  if (!item || !SPEND_ITEMS[item]) {
    return Response.json({
      error: "Invalid item",
      validItems: Object.keys(SPEND_ITEMS),
    }, { status: 400 });
  }

  const details = SPEND_ITEMS[item];
  const result = await spendPoints({
    userId: session.user.id,
    amount: details.points,
    spendType: item,
    referenceId: body.referenceId,
    description: details.description,
  });

  if (!result.success) {
    return Response.json({ error: result.reason }, { status: 402 });
  }

  // Apply feature effects to profile
  const expiresAt = new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10);
  const featureUpdates: Record<string, unknown> = {};

  if (item === "badge_color_month" && body.badgeColor) {
    featureUpdates.badge_color = { color: body.badgeColor, expiresAt };
  } else if (item === "extended_ask_ai") {
    featureUpdates.extended_ask_ai = { expiresAt };
  } else if (item === "early_access_month") {
    featureUpdates.early_access = { expiresAt };
  } else if (item === "remove_ads_month") {
    featureUpdates.remove_ads = { expiresAt };
  }
  // api_credits and boost_post would update api_keys / cards tables respectively

  if (Object.keys(featureUpdates).length > 0) {
    // Merge into existing pointFeatures jsonb
    const [profile] = await db
      .select({ pointFeatures: profiles.pointFeatures })
      .from(profiles)
      .where(eq(profiles.id, session.user.id))
      .limit(1);

    const existing = (profile?.pointFeatures as Record<string, unknown>) ?? {};
    const merged = { ...existing, ...featureUpdates };

    await db
      .insert(profiles)
      .values({ id: session.user.id, pointFeatures: merged })
      .onConflictDoUpdate({ target: profiles.id, set: { pointFeatures: merged } });
  }

  return Response.json({ ok: true, newBalance: result.newBalance });
}
