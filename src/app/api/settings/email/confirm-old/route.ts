import { db } from "@/lib/db";
import { emailChangeTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { sendEmail } from "@/lib/email";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    redirect("/settings/account?error=invalid-token");
  }

  const [changeToken] = await db
    .select()
    .from(emailChangeTokens)
    .where(eq(emailChangeTokens.token, token))
    .limit(1);

  if (!changeToken) {
    redirect("/settings/account?error=invalid-token");
  }

  if (changeToken.expiresAt < new Date().toISOString()) {
    await db.delete(emailChangeTokens).where(eq(emailChangeTokens.token, token));
    redirect("/settings/account?error=token-expired");
  }

  if (changeToken.oldEmailConfirmed) {
    // Already confirmed — just redirect with info
    redirect("/settings/account?info=check-new-email");
  }

  // Mark old email as confirmed
  await db
    .update(emailChangeTokens)
    .set({ oldEmailConfirmed: true })
    .where(eq(emailChangeTokens.token, token));

  // Send confirmation link to the new email address
  const confirmUrl = `${process.env.NEXTAUTH_URL}/api/settings/email/confirm?token=${token}`;

  await sendEmail({
    to: changeToken.newEmail,
    subject: "Confirm your new Charta Alba email address",
    html: `
      <p>Your current email has confirmed the change request. Click below to activate your new email address.</p>
      <p>This link expires 1 hour after the original request.</p>
      <p><a href="${confirmUrl}">${confirmUrl}</a></p>
      <p>If you did not request this, your account remains unchanged.</p>
    `,
  });

  redirect("/settings/account?info=check-new-email");
}
