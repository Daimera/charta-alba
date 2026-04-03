import { authenticateFounder } from "@/middleware/founderAuth";
import { db } from "@/lib/db";
import { apiKeys, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { logAudit, getRequestIp, getRequestUserAgent } from "@/lib/audit";

/** GET — list all user API keys */
export async function GET(req: Request) {
  const fa = await authenticateFounder(req, 2);
  if (!fa.ok) return fa.response;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "100"), 500);

  const rows = await db
    .select({
      id: apiKeys.id,
      keyPrefix: apiKeys.keyPrefix,
      tier: apiKeys.tier,
      isActive: apiKeys.isActive,
      requestsToday: apiKeys.requestsToday,
      requestsThisMonth: apiKeys.requestsThisMonth,
      createdAt: apiKeys.createdAt,
      lastUsedAt: apiKeys.lastUsedAt,
      userName: users.name,
      userEmail: users.email,
      userId: users.id,
    })
    .from(apiKeys)
    .leftJoin(users, eq(apiKeys.userId, users.id))
    .orderBy(desc(apiKeys.createdAt))
    .limit(limit);

  return Response.json({ keys: rows });
}

/** DELETE (via POST body) — revoke a user API key (Level 3) */
export async function POST(req: Request) {
  const body = await req.json() as {
    action?: string;
    keyId?: string;
    tier?: string;
    confirmPhrase?: string;
  };
  const fa = await authenticateFounder(req, 3, body);
  if (!fa.ok) return fa.response;

  const ip = getRequestIp(req);
  const ua = getRequestUserAgent(req);

  if (body.action === "revoke") {
    if (!body.keyId) return Response.json({ error: "keyId required" }, { status: 400 });
    await db.update(apiKeys).set({ isActive: false }).where(eq(apiKeys.id, body.keyId));
    await logAudit({
      actionType: "founder_api_key_revoked",
      targetType: "api_key", targetId: body.keyId,
      ipAddress: ip, userAgent: ua, totpVerified: true, verificationLevel: 3,
    });
    return Response.json({ ok: true });
  }

  if (body.action === "change_tier") {
    if (!body.keyId || !body.tier) {
      return Response.json({ error: "keyId and tier required" }, { status: 400 });
    }
    const validTiers = ["free", "starter", "pro", "enterprise"];
    if (!validTiers.includes(body.tier)) {
      return Response.json({ error: "tier must be: free, starter, pro, enterprise" }, { status: 400 });
    }
    await db.update(apiKeys).set({ tier: body.tier }).where(eq(apiKeys.id, body.keyId));
    await logAudit({
      actionType: "founder_api_key_tier_changed",
      targetType: "api_key", targetId: body.keyId,
      detail: { newTier: body.tier },
      ipAddress: ip, userAgent: ua, totpVerified: true, verificationLevel: 3,
    });
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}
