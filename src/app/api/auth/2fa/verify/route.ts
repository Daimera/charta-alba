/**
 * POST /api/auth/2fa/verify
 * Step 2: Verify the TOTP code and enable 2FA, returning backup codes.
 */

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  decryptTotpSecret,
  totpVerify,
  generateBackupCodes,
} from "@/lib/founder-auth";
import { checkRateLimit, getIpFromRequest } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getIpFromRequest(req);
  const rl = checkRateLimit(`2fa-verify:${session.user.id}`, 5, 15 * 60 * 1000);
  if (!rl.allowed) {
    return Response.json({ error: "Too many attempts" }, { status: 429 });
  }

  const body = await req.json() as { code?: unknown };
  const code = typeof body.code === "string" ? body.code.replace(/\s/g, "") : "";

  if (!/^\d{6}$/.test(code)) {
    return Response.json({ error: "Invalid code format" }, { status: 400 });
  }

  const [user] = await db
    .select({ totpSecret: users.totpSecret, totpEnabled: users.totpEnabled })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user?.totpSecret) {
    return Response.json({ error: "No pending 2FA setup. Call /api/auth/2fa/setup first." }, { status: 400 });
  }
  if (user.totpEnabled) {
    return Response.json({ error: "2FA is already enabled" }, { status: 409 });
  }

  const plain = decryptTotpSecret(user.totpSecret);
  if (!totpVerify(code, plain)) {
    return Response.json({ error: "Invalid code. Check your authenticator app and try again." }, { status: 400 });
  }

  const { raw, hashed } = await generateBackupCodes(8);

  await db.update(users).set({
    totpEnabled: true,
    totpBackupCodes: hashed,
    totpEnabledAt: new Date().toISOString(),
    totpFailedAttempts: 0,
  }).where(eq(users.id, session.user.id));

  return Response.json({ ok: true, backupCodes: raw });
}
