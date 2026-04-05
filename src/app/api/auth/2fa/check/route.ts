/**
 * POST /api/auth/2fa/check
 * Called by /auth/verify-2fa to validate TOTP or backup code during login.
 * Requires a valid session (user authenticated via password first).
 */

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
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
  const rl = checkRateLimit(`2fa-check:${session.user.id}`, 10, 15 * 60 * 1000);
  if (!rl.allowed) {
    return Response.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const body = await req.json() as { code?: unknown };
  const code = typeof body.code === "string" ? body.code.replace(/\s/g, "") : "";

  if (!code) {
    return Response.json({ error: "Code is required" }, { status: 400 });
  }

  const [user] = await db
    .select({
      totpSecret: users.totpSecret,
      totpEnabled: users.totpEnabled,
      totpFailedAttempts: users.totpFailedAttempts,
      totpLockedUntil: users.totpLockedUntil,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user?.totpEnabled || !user.totpSecret) {
    return Response.json({ error: "2FA is not enabled for this account" }, { status: 400 });
  }

  // Check lockout
  if (user.totpLockedUntil) {
    const until = new Date(user.totpLockedUntil);
    if (until > new Date()) {
      return Response.json({
        error: `Account temporarily locked. Try again after ${until.toLocaleTimeString()}.`,
      }, { status: 429 });
    }
    // Lockout expired — clear it
    await db.update(users)
      .set({ totpFailedAttempts: 0, totpLockedUntil: null })
      .where(eq(users.id, session.user.id));
  }

  let valid = false;

  if (/^\d{6}$/.test(code)) {
    // TOTP code
    const plain = decryptTotpSecret(user.totpSecret);
    valid = totpVerify(code, plain);
  } else {
    // Backup code (word-based format)
    const result = await verifyUserTotpBackupCode(session.user.id, code);
    valid = result.ok;
  }

  if (!valid) {
    const newAttempts = (user.totpFailedAttempts ?? 0) + 1;
    const shouldLock = newAttempts >= 5;
    const lockedUntil = shouldLock
      ? new Date(Date.now() + 30 * 60_000).toISOString()
      : null;

    await db.update(users).set({
      totpFailedAttempts: newAttempts,
      ...(lockedUntil ? { totpLockedUntil: lockedUntil } : {}),
    }).where(eq(users.id, session.user.id));

    logAuditFireAndForget({
      actionType: "2fa_check_failed",
      targetType: "user",
      targetId: session.user.id,
      ipAddress: ip,
    });

    if (shouldLock) {
      return Response.json({ error: "Too many failed attempts. Account locked for 30 minutes." }, { status: 429 });
    }

    return Response.json({ error: "Invalid code. Try again." }, { status: 400 });
  }

  // Success — reset failed attempts
  await db.update(users).set({
    totpFailedAttempts: 0,
    totpLockedUntil: null,
  }).where(eq(users.id, session.user.id));

  logAuditFireAndForget({
    actionType: "2fa_verified",
    targetType: "user",
    targetId: session.user.id,
    ipAddress: ip,
    totpVerified: true,
    verificationLevel: 1,
  });

  return Response.json({ ok: true });
}
