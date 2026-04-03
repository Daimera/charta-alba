import { createHash } from "crypto";
import { db } from "./db";
import { apiKeys, apiUsageLogs } from "./db/schema";
import { eq, sql } from "drizzle-orm";

export const TIER_LIMITS = {
  free:       { daily: 100,    monthly: 1_000,    results: 10   },
  starter:    { daily: 1_000,  monthly: 10_000,   results: 50   },
  pro:        { daily: 10_000, monthly: 100_000,  results: 200  },
  enterprise: { daily: -1,     monthly: -1,        results: 1000 },
} as const;

export type Tier = keyof typeof TIER_LIMITS;

export interface ApiKeyRecord {
  id: string;
  userId: string;
  tier: Tier;
  requestsThisMonth: number;
  requestsToday: number;
  keyPrefix: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

export interface AuthError {
  error: string;
  status: 401 | 403 | 429;
  retryAfter?: number;
}

function hashKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  const raw = `ca_live_${hex}`;
  const hash = hashKey(raw);
  const prefix = raw.slice(0, 16); // "ca_live_" + first 8 hex chars
  return { raw, hash, prefix };
}

/** Returns the rate-limit reset unix timestamp (first second of next month UTC). */
export function monthlyResetTimestamp(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1) / 1000;
}

export async function authenticateApiKey(
  req: Request
): Promise<{ key: ApiKeyRecord } | AuthError> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: "Missing or invalid Authorization header. Use: Authorization: Bearer ca_live_...", status: 401 };
  }

  const raw = authHeader.slice(7).trim();
  const hash = hashKey(raw);

  const [keyRow] = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.keyHash, hash))
    .limit(1);

  if (!keyRow || !keyRow.isActive) {
    return { error: "Invalid or revoked API key", status: 401 };
  }

  const limits = TIER_LIMITS[keyRow.tier as Tier] ?? TIER_LIMITS.free;

  // Auto-reset daily counter if we're on a new UTC date
  const todayDate = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const effectiveToday = keyRow.lastResetDate === todayDate ? keyRow.requestsToday : 0;

  if (limits.daily !== -1 && effectiveToday >= limits.daily) {
    return { error: "Daily rate limit exceeded", status: 429, retryAfter: 86400 };
  }

  if (limits.monthly !== -1 && keyRow.requestsThisMonth >= limits.monthly) {
    return {
      error: "Monthly rate limit exceeded",
      status: 429,
      retryAfter: monthlyResetTimestamp() - Math.floor(Date.now() / 1000),
    };
  }

  return { key: keyRow as unknown as ApiKeyRecord };
}

/** Fire-and-forget: increment counters + write usage log. Never throws. */
export function recordUsage(
  apiKeyId: string,
  endpoint: string,
  statusCode: number,
  responseTimeMs: number,
  ipAddress: string | null
): void {
  const todayDate = new Date().toISOString().slice(0, 10);

  Promise.all([
    db
      .update(apiKeys)
      .set({
        requestsToday: sql`CASE WHEN last_reset_date = ${todayDate} THEN ${apiKeys.requestsToday} + 1 ELSE 1 END`,
        requestsThisMonth: sql`${apiKeys.requestsThisMonth} + 1`,
        lastResetDate: todayDate,
        lastUsedAt: new Date().toISOString(),
      })
      .where(eq(apiKeys.id, apiKeyId)),
    db.insert(apiUsageLogs).values({
      apiKeyId,
      endpoint,
      statusCode,
      responseTimeMs,
      ipAddress,
    }),
  ]).catch((err) => console.error("[api-auth] recordUsage error:", err));
}

/** Build standard rate-limit response headers. */
export function rateLimitHeaders(key: ApiKeyRecord): Record<string, string> {
  const limits = TIER_LIMITS[key.tier] ?? TIER_LIMITS.free;
  const remaining = limits.monthly === -1 ? 999999 : Math.max(0, limits.monthly - key.requestsThisMonth - 1);
  return {
    "X-Powered-By": "Charta Alba API (chartaalba.com)",
    "X-RateLimit-Limit": String(limits.monthly === -1 ? "unlimited" : limits.monthly),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(monthlyResetTimestamp()),
  };
}
