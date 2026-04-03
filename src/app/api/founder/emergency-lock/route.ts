/**
 * Emergency founder account lockdown.
 * NO authentication required — accessible even if account is compromised.
 * Requires typing the exact emergency phrase to activate.
 *
 * On activation:
 * - Invalidates ALL NextAuth sessions (via invalidating all JWT secrets would
 *   require secret rotation, which isn't possible at runtime; instead we use
 *   a DB-level lockout that every founder route checks)
 * - Sets founder_locked_until to far future
 * - Logs to audit_log
 * - Sends alert email (if Resend configured)
 */

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logAudit, getRequestIp, getRequestUserAgent } from "@/lib/audit";
import { EMERGENCY_PHRASE } from "@/lib/founder-auth";

export async function POST(req: Request) {
  const body = await req.json() as { phrase?: string };

  if (body.phrase?.trim() !== EMERGENCY_PHRASE) {
    // Deliberate vague error — do not confirm or deny the phrase
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const ip = getRequestIp(req);
  const ua = getRequestUserAgent(req);

  // Find the founder
  const [founder] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.isFounder, true))
    .limit(1);

  if (!founder) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  // Lock for 30 days — requires backup code to re-enable
  const lockUntil = new Date(Date.now() + 30 * 24 * 3600_000).toISOString();

  await db
    .update(users)
    .set({
      founderLockedUntil: lockUntil,
      founderLastVerified: null,
      founderTotpAttempts: 10, // Max out attempt counter
    })
    .where(eq(users.id, founder.id));

  await logAudit({
    actionType: "founder_emergency_lock_activated",
    targetType: "user",
    targetId: founder.id,
    detail: { lockedUntil: lockUntil, triggeredFromIp: ip },
    ipAddress: ip,
    userAgent: ua,
    totpVerified: false,
    verificationLevel: 1,
  });

  // Send alert email if configured
  if (process.env.RESEND_API_KEY && founder.email) {
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "security@chartaalba.com",
        to: founder.email,
        subject: "🚨 EMERGENCY LOCK ACTIVATED — Charta Alba Founder Account",
        html: `
          <h2>Emergency lock was activated on your Charta Alba founder account.</h2>
          <p><strong>Time:</strong> ${new Date().toUTCString()}</p>
          <p><strong>IP:</strong> ${ip}</p>
          <p><strong>Locked until:</strong> ${lockUntil}</p>
          <p>Your account is now locked. To restore access, you must use a backup code at <strong>/founder/verify</strong>.</p>
          <p>If you did not trigger this lock, your account may be compromised. Use your backup codes immediately and review the audit log.</p>
        `,
      }),
    }).catch(() => undefined);
  }

  return Response.json({
    ok: true,
    message: "Founder account locked. Use a backup code to restore access.",
    lockedUntil: lockUntil,
  });
}
