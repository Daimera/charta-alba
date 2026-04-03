import { authenticateFounder } from "@/middleware/founderAuth";
import { db } from "@/lib/db";
import { users, profiles, pointsLedger } from "@/lib/db/schema";
import { eq, ilike, or, sql, desc } from "drizzle-orm";
import { logAudit, getRequestIp, getRequestUserAgent } from "@/lib/audit";
import { hash } from "bcryptjs";
import crypto from "crypto";

export async function GET(req: Request) {
  const fa = await authenticateFounder(req, 2);
  if (!fa.ok) return fa.response;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isFounder: users.isFounder,
      createdAt: users.createdAt,
      isActive: profiles.isActive,
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.id, users.id))
    .where(
      q
        ? or(
            ilike(users.email, `%${q}%`),
            ilike(users.name, `%${q}%`),
          )
        : undefined,
    )
    .orderBy(desc(users.createdAt))
    .limit(limit);

  return Response.json({ users: rows });
}

export async function POST(req: Request) {
  const body = await req.json() as {
    action?: string;
    userId?: string;
    reason?: string;
    role?: string;
    pointsAmount?: number;
    confirmPhrase?: string;
  };

  const fa = await authenticateFounder(req, 3, body);
  if (!fa.ok) return fa.response;

  const { action, userId, reason } = body;
  if (!userId) return Response.json({ error: "userId required" }, { status: 400 });

  const [target] = await db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!target) return Response.json({ error: "User not found" }, { status: 404 });

  const ip = getRequestIp(req);
  const ua = getRequestUserAgent(req);

  if (action === "suspend") {
    if (!reason) return Response.json({ error: "reason required" }, { status: 400 });
    await db.update(profiles).set({ isActive: false }).where(eq(profiles.id, userId));
    await logAudit({
      actionType: "founder_user_suspended",
      targetType: "user", targetId: userId,
      detail: { email: target.email, reason },
      ipAddress: ip, userAgent: ua, totpVerified: true, verificationLevel: 3,
    });
    return Response.json({ ok: true });
  }

  if (action === "restore") {
    await db.update(profiles).set({ isActive: true }).where(eq(profiles.id, userId));
    await logAudit({
      actionType: "founder_user_restored",
      targetType: "user", targetId: userId,
      detail: { email: target.email },
      ipAddress: ip, userAgent: ua, totpVerified: true, verificationLevel: 3,
    });
    return Response.json({ ok: true });
  }

  if (action === "reset_password") {
    // Generate a secure temporary password and hash it
    const tempPassword = crypto.randomBytes(12).toString("base64url");
    const tempHash = await hash(tempPassword, 12);
    await db.update(users).set({ passwordHash: tempHash }).where(eq(users.id, userId));
    await logAudit({
      actionType: "founder_password_reset",
      targetType: "user", targetId: userId,
      detail: { email: target.email },
      ipAddress: ip, userAgent: ua, totpVerified: true, verificationLevel: 3,
    });
    // Return temp password once — caller must deliver securely
    return Response.json({ ok: true, tempPassword });
  }

  if (action === "set_role") {
    const newRole = body.role;
    if (!newRole || !["user", "moderator", "admin"].includes(newRole)) {
      return Response.json({ error: "role must be: user, moderator, admin" }, { status: 400 });
    }
    await db.update(users).set({ role: newRole }).where(eq(users.id, userId));
    await logAudit({
      actionType: "founder_role_changed",
      targetType: "user", targetId: userId,
      detail: { email: target.email, newRole },
      ipAddress: ip, userAgent: ua, totpVerified: true, verificationLevel: 3,
    });
    return Response.json({ ok: true });
  }

  if (action === "award_points") {
    const amount = body.pointsAmount;
    if (!amount || amount <= 0 || !reason) {
      return Response.json({ error: "pointsAmount > 0 and reason required" }, { status: 400 });
    }
    await db.insert(pointsLedger).values({
      userId,
      amount,
      transactionType: "admin_award",
      description: `Founder award: ${reason}`,
      isFlagged: false,
    });
    await logAudit({
      actionType: "founder_points_awarded",
      targetType: "user", targetId: userId,
      detail: { email: target.email, amount, reason },
      ipAddress: ip, userAgent: ua, totpVerified: true, verificationLevel: 3,
    });
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}
