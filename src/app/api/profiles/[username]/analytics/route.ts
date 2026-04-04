import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profileViews, profiles, users } from "@/lib/db/schema";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { countryFlag } from "@/lib/geo";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const session = await auth();

  // Resolve profile
  const [profile] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.username, username))
    .limit(1);

  if (!profile) return Response.json({ error: "Not found" }, { status: 404 });

  const profileUserId = profile.id;

  // Only owner or founder can view analytics
  const isOwner = session?.user?.id === profileUserId;
  const isFounder = session?.user?.isFounder === true;
  if (!isOwner && !isFounder) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const todayStart  = new Date(now.toISOString().slice(0, 10) + "T00:00:00Z").toISOString();
  const weekAgo     = new Date(now.getTime() - 7 * 86400_000).toISOString();
  const monthAgo    = new Date(now.getTime() - 30 * 86400_000).toISOString();

  const [totalRow, todayRow, weekRow, monthRow] = await Promise.all([
    db.select({ count: sql<number>`COUNT(*)::int` })
      .from(profileViews).where(eq(profileViews.profileUserId, profileUserId)),
    db.select({ count: sql<number>`COUNT(*)::int` })
      .from(profileViews).where(and(eq(profileViews.profileUserId, profileUserId), gte(profileViews.viewedAt, todayStart))),
    db.select({ count: sql<number>`COUNT(*)::int` })
      .from(profileViews).where(and(eq(profileViews.profileUserId, profileUserId), gte(profileViews.viewedAt, weekAgo))),
    db.select({ count: sql<number>`COUNT(*)::int` })
      .from(profileViews).where(and(eq(profileViews.profileUserId, profileUserId), gte(profileViews.viewedAt, monthAgo))),
  ]);

  // Top countries
  const topCountries = await db
    .select({
      country:     profileViews.country,
      countryCode: profileViews.countryCode,
      count:       sql<number>`COUNT(*)::int`,
    })
    .from(profileViews)
    .where(and(eq(profileViews.profileUserId, profileUserId), sql`${profileViews.country} IS NOT NULL`))
    .groupBy(profileViews.country, profileViews.countryCode)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(10);

  // Top cities
  const topCities = await db
    .select({
      city:    profileViews.city,
      country: profileViews.country,
      count:   sql<number>`COUNT(*)::int`,
    })
    .from(profileViews)
    .where(and(eq(profileViews.profileUserId, profileUserId), sql`${profileViews.city} IS NOT NULL`))
    .groupBy(profileViews.city, profileViews.country)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(10);

  // Views by day (last 30 days)
  const viewsByDay = await db
    .select({
      date:  sql<string>`DATE(${profileViews.viewedAt})::text`,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(profileViews)
    .where(and(eq(profileViews.profileUserId, profileUserId), gte(profileViews.viewedAt, monthAgo)))
    .groupBy(sql`DATE(${profileViews.viewedAt})`)
    .orderBy(sql`DATE(${profileViews.viewedAt})`);

  // Device breakdown
  const deviceBreakdown = await db
    .select({
      deviceType: profileViews.deviceType,
      count:      sql<number>`COUNT(*)::int`,
    })
    .from(profileViews)
    .where(eq(profileViews.profileUserId, profileUserId))
    .groupBy(profileViews.deviceType);

  // Browser breakdown
  const browserBreakdown = await db
    .select({
      browser: profileViews.browser,
      count:   sql<number>`COUNT(*)::int`,
    })
    .from(profileViews)
    .where(eq(profileViews.profileUserId, profileUserId))
    .groupBy(profileViews.browser)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(6);

  // Recent viewers (last 20) — join with users for username
  const recentViewers = await db
    .select({
      viewerUserId: profileViews.viewerUserId,
      city:         profileViews.city,
      country:      profileViews.country,
      countryCode:  profileViews.countryCode,
      deviceType:   profileViews.deviceType,
      viewedAt:     profileViews.viewedAt,
      viewerName:   users.name,
      viewerUsername: profiles.username,
    })
    .from(profileViews)
    .leftJoin(users, eq(profileViews.viewerUserId, users.id))
    .leftJoin(profiles, eq(profileViews.viewerUserId, profiles.id))
    .where(eq(profileViews.profileUserId, profileUserId))
    .orderBy(desc(profileViews.viewedAt))
    .limit(20);

  const deviceMap = Object.fromEntries(deviceBreakdown.map((d) => [d.deviceType ?? "desktop", d.count]));

  return Response.json({
    totalViews:      totalRow[0]?.count ?? 0,
    viewsToday:      todayRow[0]?.count ?? 0,
    viewsThisWeek:   weekRow[0]?.count ?? 0,
    viewsThisMonth:  monthRow[0]?.count ?? 0,
    topCountries: topCountries.map((c) => ({
      country:     c.country,
      countryCode: c.countryCode,
      count:       c.count,
      flag:        countryFlag(c.countryCode ?? ""),
    })),
    topCities,
    viewsByDay,
    deviceBreakdown: {
      mobile:  deviceMap["mobile"]  ?? 0,
      tablet:  deviceMap["tablet"]  ?? 0,
      desktop: deviceMap["desktop"] ?? 0,
    },
    browserBreakdown: Object.fromEntries(browserBreakdown.map((b) => [b.browser ?? "Unknown", b.count])),
    recentViewers: recentViewers.map((v) => ({
      username:  v.viewerUsername ?? (v.viewerUserId ? v.viewerName ?? "User" : "Anonymous"),
      city:      v.city,
      country:   v.country,
      flag:      countryFlag(v.countryCode ?? ""),
      device:    v.deviceType,
      viewedAt:  v.viewedAt,
    })),
  });
}
