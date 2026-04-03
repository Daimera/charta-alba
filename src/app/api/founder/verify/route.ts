import { auth } from "@/lib/auth";
import { verifyFounderTotp } from "@/lib/founder-auth";
import { logAudit, getRequestIp, getRequestUserAgent } from "@/lib/audit";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.user.isFounder) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json() as { code?: string };
  const code = String(body.code ?? "").trim();

  if (!code || !/^\d{6}$/.test(code)) {
    return Response.json({ error: "Invalid code format — enter 6 digits" }, { status: 400 });
  }

  const result = await verifyFounderTotp(session.user.id, code);

  await logAudit({
    actionType: result.ok ? "founder_totp_verified" : "founder_totp_failed",
    detail: result.ok ? undefined : { reason: result.reason },
    ipAddress: getRequestIp(req),
    userAgent: getRequestUserAgent(req),
    totpVerified: result.ok,
    verificationLevel: result.ok ? 2 : 1,
  });

  if (!result.ok) {
    return Response.json(
      {
        error: result.reason,
        attemptsLeft: result.attemptsLeft,
        lockedUntil: result.lockedUntil,
      },
      { status: 400 },
    );
  }

  return Response.json({ ok: true });
}
