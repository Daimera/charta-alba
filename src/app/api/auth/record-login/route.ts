/**
 * POST /api/auth/record-login
 * Called once per browser session (guarded by sessionStorage flag in TopNav).
 * Extracts IP + UA from request headers, geolocates, detects new-country anomaly,
 * and inserts a login_sessions row.
 */

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { loginSessions, users } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { getLocationFromIP, extractIp } from "@/lib/geo";
import { parseUserAgent } from "@/lib/ua";

export async function POST(req: Request) {
  try {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const ip = extractIp(req);
  const ua = req.headers.get("user-agent") ?? undefined;
  const geo = getLocationFromIP(ip);
  const device = parseUserAgent(ua);

  // Get last 3 logins to detect new-country anomaly
  const recent = await db
    .select({ countryCode: loginSessions.countryCode, isSuspicious: loginSessions.isSuspicious })
    .from(loginSessions)
    .where(eq(loginSessions.userId, userId))
    .orderBy(desc(loginSessions.createdAt))
    .limit(3);

  // Filter out "XX" (unknown/localhost) so development sessions don't pollute the history
  const recentCountries = recent.map((r) => r.countryCode).filter((c): c is string => !!c && c !== "XX");
  const newCountry = geo?.countryCode && geo.countryCode !== "XX";
  const isSuspicious =
    newCountry &&
    recentCountries.length >= 1 &&
    !recentCountries.includes(geo.countryCode);

  await db.insert(loginSessions).values({
    userId,
    ipAddress: ip,
    userAgent: ua ?? null,
    country:     geo?.country ?? null,
    countryCode: geo?.countryCode ?? null,
    region:      geo?.region ?? null,
    city:        geo?.city ?? null,
    timezone:    geo?.timezone ?? null,
    latitude:    geo?.lat ?? null,
    longitude:   geo?.lon ?? null,
    deviceType:  device.deviceType,
    browser:     device.browser,
    os:          device.os,
    isSuspicious: !!isSuspicious,
  });

  // Send security alert for new-country logins
  if (isSuspicious && geo) {
    const [user] = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user?.email && process.env.RESEND_API_KEY) {
      const alertEmail = user.email;
      const loginTime = new Date().toUTCString();
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "security@chartaalba.com",
          to: alertEmail,
          subject: `New sign-in from ${geo.city || geo.country} — Charta Alba`,
          html: `
            <p>Hi ${user.name ?? "there"},</p>
            <p>We noticed a new sign-in to your Charta Alba account from a location we haven't seen before:</p>
            <ul>
              <li><strong>Location:</strong> ${[geo.city, geo.country].filter(Boolean).join(", ")}</li>
              <li><strong>Device:</strong> ${device.browser} on ${device.os} (${device.deviceType})</li>
              <li><strong>Time:</strong> ${loginTime}</li>
            </ul>
            <p>If this was you, no action is needed.</p>
            <p>If this wasn't you, <a href="${process.env.NEXTAUTH_URL ?? "https://chartaalba.com"}/settings/security">secure your account immediately</a>.</p>
          `,
        }),
      }).catch(() => undefined);
    }
  }

  return Response.json({ ok: true, isSuspicious: !!isSuspicious });
  } catch (err) {
    console.error("[api/auth/record-login]", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
