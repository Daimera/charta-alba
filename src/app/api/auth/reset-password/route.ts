import { db } from "@/lib/db";
import { users, passwordResetTokens, sessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";

export async function POST(req: Request) {
  const body = await req.json() as { token?: string; password?: string };
  const { token, password } = body;

  if (!token || !password) {
    return Response.json({ error: "Token and password are required" }, { status: 400 });
  }

  if (password.length < 8) {
    return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const now = new Date().toISOString();

  const [resetToken] = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.token, token))
    .limit(1);

  if (!resetToken) {
    return Response.json({ error: "Invalid or expired reset link" }, { status: 400 });
  }

  if (resetToken.expiresAt < now) {
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));
    return Response.json({
      error: "This reset link has expired. Please request a new one.",
      expired: true,
    }, { status: 400 });
  }

  const passwordHash = await hash(password, 12);

  const [updatedUser] = await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.email, resetToken.email))
    .returning({ id: users.id, email: users.email });

  if (!updatedUser) {
    console.error("[reset-password] Update matched zero rows for email:", resetToken.email);
    return Response.json({ error: "Failed to update password." }, { status: 500 });
  }

  console.log("[reset-password] Password updated for:", updatedUser.email,
    "hash prefix:", passwordHash.slice(0, 10));

  // Invalidate any DB-stored sessions (belt-and-suspenders for OAuth sessions)
  await db.delete(sessions).where(eq(sessions.userId, updatedUser.id));

  // Consume the reset token
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));

  return Response.json({ ok: true });
}
