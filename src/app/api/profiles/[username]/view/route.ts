import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profileViews, profiles, users } from "@/lib/db/schema";
import { and, eq, gte, sql, count } from "drizzle-orm";
import { getLocationFromIP, extractIp } from "@/lib/geo";
import { parseUserAgent } from "@/lib/ua";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
  const { username } = await params;
  const session = await auth();
  const ip = extractIp(req);
  const ua = req.headers.get("user-agent") ?? null;
  const geo = getLocationFromIP(ip);
  const device = parseUserAgent(ua);

  // Resolve profile owner by username
  const [profile] = await db
    .select({ id: profiles.id, shareLocationWithCreators: profiles.shareLocationWithCreators })
    .from(profiles)
    .where(eq(profiles.username, username))
    .limit(1);

  if (!profile) return Response.json({ error: "Profile not found" }, { status: 404 });

  const profileUserId = profile.id;
  const viewerUserId = session?.user?.id ?? null;

  // Don't count self-views
  if (viewerUserId === profileUserId) {
    const [stats] = await db
      .select({ total: sql<number>`COUNT(*)::int` })
      .from(profileViews)
      .where(eq(profileViews.profileUserId, profileUserId));
    return Response.json({ totalViews: stats?.total ?? 0, selfView: true });
  }

  // Dedup: same IP within 1 hour
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const [existing] = await db
    .select({ id: profileViews.id })
    .from(profileViews)
    .where(
      and(
        eq(profileViews.profileUserId, profileUserId),
        eq(profileViews.viewerIp, ip),
        gte(profileViews.viewedAt, hourAgo),
      ),
    )
    .limit(1);

  if (!existing) {
    const body = await req.json().catch(() => ({})) as { referrer?: string };

    // If viewer has location sharing OFF, anonymize
    let shareLocation = true;
    if (viewerUserId) {
      const [viewerProfile] = await db
        .select({ shareLocationWithCreators: profiles.shareLocationWithCreators })
        .from(profiles)
        .where(eq(profiles.id, viewerUserId))
        .limit(1);
      shareLocation = viewerProfile?.shareLocationWithCreators ?? true;
    }

    await db.insert(profileViews).values({
      profileUserId,
      viewerUserId: shareLocation ? viewerUserId : null,
      viewerIp: ip,
      country:     shareLocation ? (geo?.country ?? null)      : null,
      countryCode: shareLocation ? (geo?.countryCode ?? null)  : null,
      region:      shareLocation ? (geo?.region ?? null)       : null,
      city:        shareLocation ? (geo?.city ?? null)         : null,
      deviceType:  device.deviceType,
      browser:     device.browser,
      referrerUrl: body.referrer ?? null,
    });
  }

  // Return public stats
  const [totalRow, weekRow] = await Promise.all([
    db.select({ total: sql<number>`COUNT(*)::int` })
      .from(profileViews)
      .where(eq(profileViews.profileUserId, profileUserId)),
    db.select({ count: sql<number>`COUNT(*)::int` })
      .from(profileViews)
      .where(
        and(
          eq(profileViews.profileUserId, profileUserId),
          gte(profileViews.viewedAt, new Date(Date.now() - 7 * 86400_000).toISOString()),
        ),
      ),
  ]);

  return Response.json({
    totalViews: totalRow[0]?.total ?? 0,
    viewsThisWeek: weekRow[0]?.count ?? 0,
  });
  } catch (err) {
    console.error("[api/profiles/view]", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
