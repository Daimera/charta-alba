import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/lib/db/schema";
import { eq, gt } from "drizzle-orm";
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
    return Response.json({ error: "Reset link has expired" }, { status: 400 });
  }

  const passwordHash = await hash(password, 12);

  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.email, resetToken.email));

  // Delete used token
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));

  return Response.json({ ok: true });
}
