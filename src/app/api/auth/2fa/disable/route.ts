/**
 * POST /api/auth/2fa/disable
 * Requires current TOTP code or backup code to disable.
 */

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  decryptTotpSecret,
  totpVerify,
  verifyUserTotpBackupCode,
} from "@/lib/founder-auth";
import { checkRateLimit, getIpFromRequest } from "@/lib/rate-limit";
import { logAuditFireAndForget } from "@/lib/audit";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getIpFromRequest(req);
  const rl = checkRateLimit(`2fa-disable:${session.user.id}`, 5, 15 * 60 * 1000);
  if (!rl.allowed) {
    return Response.json({ error: "Too many attempts" }, { status: 429 });
  }

  const body = await req.json() as { code?: unknown };
  const code = typeof body.code === "string" ? body.code.replace(/\s/g, "") : "";

  if (!code) {
    return Response.json({ error: "TOTP code or backup code required" }, { status: 400 });
  }

  const [user] = await db
    .select({ totpSecret: users.totpSecret, totpEnabled: users.totpEnabled, totpBackupCodes: users.totpBackupCodes })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user?.totpEnabled) {
    return Response.json({ error: "2FA is not enabled" }, { status: 400 });
  }

  let valid = false;

  if (/^\d{6}$/.test(code) && user.totpSecret) {
    const plain = decryptTotpSecret(user.totpSecret);
    valid = totpVerify(code, plain);
  } else {
    // Try backup code
    const result = await verifyUserTotpBackupCode(session.user.id, code);
    valid = result.ok;
  }

  if (!valid) {
    return Response.json({ error: "Invalid code" }, { status: 400 });
  }

  await db.update(users).set({
    totpEnabled: false,
    totpSecret: null,
    totpBackupCodes: null,
    totpEnabledAt: null,
    totpFailedAttempts: 0,
    totpLockedUntil: null,
  }).where(eq(users.id, session.user.id));

  logAuditFireAndForget({
    actionType: "2fa_disabled",
    targetType: "user",
    targetId: session.user.id,
    ipAddress: ip,
    totpVerified: true,
    verificationLevel: 1,
  });

  return Response.json({ ok: true });
}
