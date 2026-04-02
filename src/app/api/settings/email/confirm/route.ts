import { db } from "@/lib/db";
import { users, emailChangeTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    redirect("/settings/account?error=invalid-token");
  }

  const now = new Date().toISOString();

  const [changeToken] = await db
    .select()
    .from(emailChangeTokens)
    .where(eq(emailChangeTokens.token, token))
    .limit(1);

  if (!changeToken) {
    redirect("/settings/account?error=invalid-token");
  }

  if (changeToken.expiresAt < now) {
    await db.delete(emailChangeTokens).where(eq(emailChangeTokens.token, token));
    redirect("/settings/account?error=token-expired");
  }

  // Old email must have confirmed first
  if (!changeToken.oldEmailConfirmed) {
    redirect("/settings/account?error=old-email-not-confirmed");
  }

  await db
    .update(users)
    .set({ email: changeToken.newEmail })
    .where(eq(users.id, changeToken.userId));

  await db.delete(emailChangeTokens).where(eq(emailChangeTokens.token, token));

  redirect("/settings/account?success=email-changed");
}
