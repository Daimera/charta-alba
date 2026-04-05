/**
 * POST /api/auth/2fa/setup
 * Step 1: Generate a TOTP secret and return QR code URL.
 * Does NOT enable 2FA yet — user must verify first.
 */

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  generateTotpSecret,
  encryptTotpSecret,
  buildOtpauthUrl,
} from "@/lib/founder-auth";

export async function POST(_req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if already enabled
  const [user] = await db
    .select({ totpEnabled: users.totpEnabled, email: users.email })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (user?.totpEnabled) {
    return Response.json({ error: "2FA is already enabled" }, { status: 409 });
  }

  const secret = generateTotpSecret();
  const encrypted = encryptTotpSecret(secret);
  const email = user?.email ?? session.user.email ?? "user";
  const otpauthUrl = buildOtpauthUrl(email, secret);

  // Store the encrypted secret (but keep totpEnabled = false until verified)
  await db.update(users).set({ totpSecret: encrypted }).where(eq(users.id, session.user.id));

  return Response.json({ otpauthUrl, secret });
}
