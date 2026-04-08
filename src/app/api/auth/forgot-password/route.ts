import { db } from "@/lib/db";
import { users, profiles, passwordResetTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "@/lib/email";
import { randomBytes } from "crypto";
import { checkRateLimit, getIpFromRequest } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    // 3 requests per IP per hour
    const ip = getIpFromRequest(req);
    const rl = checkRateLimit(`forgot-pw:${ip}`, 3, 60 * 60_000);
    if (!rl.allowed) {
      return Response.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
      );
    }

    const body = await req.json() as { email?: string };
    const identifier = body.email?.trim();

    if (!identifier) {
      return Response.json({ error: "Please enter your email, username, or phone number" }, { status: 400 });
    }

    // Resolve identifier → email
    let resolvedEmail: string | undefined;

    if (identifier.includes("@") && identifier.includes(".")) {
      // Looks like an email
      resolvedEmail = identifier.toLowerCase();
    } else if (identifier.startsWith("+") || /^\d+$/.test(identifier)) {
      // Phone number
      const [row] = await db
        .select({ email: users.email })
        .from(users)
        .innerJoin(profiles, eq(users.id, profiles.id))
        .where(eq(profiles.phone, identifier))
        .limit(1);
      resolvedEmail = row?.email;
    } else {
      // Username (strip @ if present)
      const username = identifier.replace(/^@/, "").toLowerCase();
      const [row] = await db
        .select({ email: users.email })
        .from(users)
        .innerJoin(profiles, eq(users.id, profiles.id))
        .where(eq(profiles.username, username))
        .limit(1);
      resolvedEmail = row?.email;
    }

    // Always return success to avoid user enumeration
    if (!resolvedEmail) {
      return Response.json({ ok: true });
    }

    const email = resolvedEmail;

    const [user] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    const isDev = !process.env.RESEND_API_KEY || process.env.NODE_ENV === "development";
    let devResetUrl: string | undefined;

    if (user) {
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

      await db.insert(passwordResetTokens).values({ token, email, expiresAt });

      const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;

      if (isDev) {
        // No email provider — expose URL in response for dev testing only
        devResetUrl = resetUrl;
      } else {
        await sendEmail({
          to: email,
          subject: "Reset your Charta Alba password",
          html: `
            <p>Hi,</p>
            <p>Click the link below to reset your password. This link expires in 24 hours.</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>If you didn't request this, you can safely ignore this email.</p>
          `,
        });
      }
    }

    return Response.json({ ok: true, ...(devResetUrl ? { devResetUrl } : {}) });
  } catch (err) {
    console.error("[api/auth/forgot-password]", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
