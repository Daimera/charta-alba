import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, emailChangeTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "@/lib/email";
import { randomBytes } from "crypto";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { newEmail?: string };
  const newEmail = body.newEmail?.trim().toLowerCase();

  if (!newEmail) {
    return Response.json({ error: "New email is required" }, { status: 400 });
  }

  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  if (newEmail === user.email) {
    return Response.json({ error: "New email is the same as your current email" }, { status: 400 });
  }

  // Check if new email is already taken
  const [taken] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, newEmail))
    .limit(1);

  if (taken) {
    return Response.json({ error: "That email address is already in use" }, { status: 409 });
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  await db.insert(emailChangeTokens).values({
    token,
    userId: session.user.id,
    newEmail,
    oldEmailConfirmed: false,
    expiresAt,
  });

  // Step 1: send confirmation link to OLD email
  const confirmOldUrl = `${process.env.NEXTAUTH_URL}/api/settings/email/confirm-old?token=${token}`;

  await sendEmail({
    to: user.email,
    subject: "Confirm your Charta Alba email change",
    html: `
      <p>You requested to change your Charta Alba email address to <strong>${newEmail}</strong>.</p>
      <p>Click the link below to confirm this request from your current email. This link expires in 1 hour.</p>
      <p><a href="${confirmOldUrl}">${confirmOldUrl}</a></p>
      <p>If you didn't request this, you can safely ignore this email — your address will not be changed.</p>
    `,
  });

  return Response.json({ ok: true });
}
