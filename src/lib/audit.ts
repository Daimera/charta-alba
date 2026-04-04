/**
 * Audit logging for founder actions and security events.
 * All inserts are fire-and-forget (non-blocking) unless you need to await.
 * The audit_log table has a DB-level immutability trigger — rows are never modified.
 *
 * Security action types:
 *  auth_failed              — failed credential login
 *  auth_locked              — account locked after too many failures
 *  rate_limited             — IP rate-limited on an endpoint
 *  forbidden_access         — 403 on a protected resource
 *  founder_access_attempt   — non-founder attempted to access /founder/*
 *  api_key_new_ip           — API key used from a new IP/country
 *
 * Founder action types:
 *  founder_totp_verified, founder_totp_failed, founder_locked,
 *  founder_user_suspended, founder_user_restored, founder_password_reset,
 *  founder_role_changed, founder_points_awarded, founder_config_updated,
 *  founder_api_key_generated, founder_api_key_rotated, founder_emergency_lock
 */

import { db } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";

export interface AuditParams {
  actionType: string;
  targetType?: string;
  targetId?: string;
  detail?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  totpVerified?: boolean;
  verificationLevel?: 1 | 2 | 3 | 4;
}

/** Insert an audit log entry. Call with await for critical actions, fire-and-forget for others. */
export async function logAudit(params: AuditParams): Promise<void> {
  await db.insert(auditLog).values({
    actionType: params.actionType,
    targetType: params.targetType ?? null,
    targetId: params.targetId ?? null,
    detail: params.detail ?? null,
    ipAddress: params.ipAddress ?? null,
    userAgent: params.userAgent ?? null,
    totpVerified: params.totpVerified ?? false,
    verificationLevel: params.verificationLevel ?? 1,
  });
}

/** Non-blocking audit log — use when you cannot await (e.g. during response streaming). */
export function logAuditFireAndForget(params: AuditParams): void {
  logAudit(params).catch(() => undefined);
}

/** Extract IP from a Next.js Request. */
export function getRequestIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

/** Extract User-Agent from a Next.js Request. */
export function getRequestUserAgent(req: Request): string {
  return req.headers.get("user-agent") ?? "unknown";
}
