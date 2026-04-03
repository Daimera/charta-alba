/**
 * Audit logging for founder actions.
 * All inserts are fire-and-forget (non-blocking) unless you need to await.
 * The audit_log table has a DB-level immutability trigger — rows are never modified.
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
