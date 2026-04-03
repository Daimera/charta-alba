import { authenticateFounder } from "@/middleware/founderAuth";
import { db } from "@/lib/db";
import { systemConfig, featureFlags } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logAudit, getRequestIp, getRequestUserAgent } from "@/lib/audit";

export async function GET(req: Request) {
  const fa = await authenticateFounder(req, 2);
  if (!fa.ok) return fa.response;

  const [config, flags] = await Promise.all([
    db.select().from(systemConfig).orderBy(systemConfig.key),
    db.select().from(featureFlags).orderBy(featureFlags.key),
  ]);

  return Response.json({ config, flags });
}

export async function POST(req: Request) {
  const body = await req.json() as {
    type?: string;
    key?: string;
    value?: unknown;
    enabled?: boolean;
    confirmPhrase?: string;
  };
  const fa = await authenticateFounder(req, 3, body);
  if (!fa.ok) return fa.response;

  const ip = getRequestIp(req);
  const ua = getRequestUserAgent(req);

  if (!body.key) return Response.json({ error: "key required" }, { status: 400 });

  if (body.type === "config") {
    if (body.value === undefined) return Response.json({ error: "value required" }, { status: 400 });
    await db
      .update(systemConfig)
      .set({
        value: body.value,
        updatedAt: new Date().toISOString(),
        updatedBy: fa.founderId,
      })
      .where(eq(systemConfig.key, body.key));

    await logAudit({
      actionType: "founder_config_updated",
      targetType: "system_config", targetId: body.key,
      detail: { value: body.value },
      ipAddress: ip, userAgent: ua, totpVerified: true, verificationLevel: 3,
    });
    return Response.json({ ok: true });
  }

  if (body.type === "flag") {
    if (body.enabled === undefined) return Response.json({ error: "enabled required" }, { status: 400 });
    await db
      .update(featureFlags)
      .set({
        enabled: body.enabled,
        updatedAt: new Date().toISOString(),
        updatedBy: fa.founderId,
      })
      .where(eq(featureFlags.key, body.key));

    await logAudit({
      actionType: "founder_feature_flag_toggled",
      targetType: "feature_flag", targetId: body.key,
      detail: { enabled: body.enabled },
      ipAddress: ip, userAgent: ua, totpVerified: true, verificationLevel: 3,
    });
    return Response.json({ ok: true });
  }

  return Response.json({ error: "type must be 'config' or 'flag'" }, { status: 400 });
}
