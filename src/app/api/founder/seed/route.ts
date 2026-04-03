import { authenticateFounder } from "@/middleware/founderAuth";
import { logAudit, getRequestIp, getRequestUserAgent } from "@/lib/audit";

export async function POST(req: Request) {
  const body = await req.json() as { confirmPhrase?: string };
  const fa = await authenticateFounder(req, 3, body);
  if (!fa.ok) return fa.response;

  const ip = getRequestIp(req);
  const ua = getRequestUserAgent(req);

  await logAudit({
    actionType: "founder_manual_seed_triggered",
    ipAddress: ip, userAgent: ua, totpVerified: true, verificationLevel: 3,
  });

  // Trigger the existing cron endpoint internally
  const baseUrl = process.env.NEXTAUTH_URL ?? "https://chartaalba.com";
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    fetch(`${baseUrl}/api/cron/seed`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cronSecret}` },
    }).catch(() => undefined);
    return Response.json({ ok: true, message: "arXiv seed triggered via cron endpoint" });
  }

  return Response.json({ ok: true, message: "Seed trigger noted (configure CRON_SECRET to auto-run)" });
}
