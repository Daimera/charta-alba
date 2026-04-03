import { authenticateFounder } from "@/middleware/founderAuth";
import { generateFounderApiKey } from "@/lib/founder-auth";
import { db } from "@/lib/db";
import { founderApiKey } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logAudit, getRequestIp, getRequestUserAgent } from "@/lib/audit";

/** GET — return active founder key info (prefix only, never raw) */
export async function GET(req: Request) {
  const fa = await authenticateFounder(req, 2);
  if (!fa.ok) return fa.response;

  const [key] = await db
    .select({
      id: founderApiKey.id,
      keyPrefix: founderApiKey.keyPrefix,
      createdAt: founderApiKey.createdAt,
      lastUsedAt: founderApiKey.lastUsedAt,
      isActive: founderApiKey.isActive,
    })
    .from(founderApiKey)
    .where(eq(founderApiKey.isActive, true))
    .limit(1);

  return Response.json({ key: key ?? null });
}

/** POST — generate or rotate founder API key (Level 3) */
export async function POST(req: Request) {
  const body = await req.json() as { confirmPhrase?: string };
  const fa = await authenticateFounder(req, 3, body);
  if (!fa.ok) return fa.response;

  const ip = getRequestIp(req);
  const ua = getRequestUserAgent(req);

  // Deactivate any existing key
  await db.update(founderApiKey).set({ isActive: false }).where(eq(founderApiKey.isActive, true));

  const { raw, hash, prefix } = generateFounderApiKey();

  await db.insert(founderApiKey).values({
    keyHash: hash,
    keyPrefix: prefix,
    isActive: true,
  });

  await logAudit({
    actionType: "founder_api_key_rotated",
    detail: { prefix },
    ipAddress: ip, userAgent: ua, totpVerified: true, verificationLevel: 3,
  });

  // Return raw key once — it will never be shown again
  return Response.json({ ok: true, key: raw, prefix });
}
