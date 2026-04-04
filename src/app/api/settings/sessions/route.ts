import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { loginSessions, accounts } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { maskIp, countryFlag } from "@/lib/geo";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [sessionRows, googleAccount] = await Promise.all([
    db
      .select({
        id:           loginSessions.id,
        ipAddress:    loginSessions.ipAddress,
        country:      loginSessions.country,
        countryCode:  loginSessions.countryCode,
        city:         loginSessions.city,
        deviceType:   loginSessions.deviceType,
        browser:      loginSessions.browser,
        os:           loginSessions.os,
        isSuspicious: loginSessions.isSuspicious,
        createdAt:    loginSessions.createdAt,
      })
      .from(loginSessions)
      .where(eq(loginSessions.userId, session.user.id))
      .orderBy(desc(loginSessions.createdAt))
      .limit(10),
    db
      .select({ provider: accounts.provider })
      .from(accounts)
      .where(eq(accounts.userId, session.user.id))
      .limit(10),
  ]);

  const connectedProviders = googleAccount.map((a) => a.provider);

  const enriched = sessionRows.map((s, i) => ({
    id:           s.id,
    ipMasked:     maskIp(s.ipAddress ?? ""),
    country:      s.country,
    countryCode:  s.countryCode,
    city:         s.city,
    flag:         countryFlag(s.countryCode ?? ""),
    deviceType:   s.deviceType,
    browser:      s.browser,
    os:           s.os,
    isSuspicious: s.isSuspicious,
    isCurrent:    i === 0, // most recent = current session
    createdAt:    s.createdAt,
  }));

  return Response.json({ sessions: enriched, connectedProviders });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return Response.json({ ok: true });
}
