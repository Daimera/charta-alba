import { db } from "@/lib/db";
import { profiles, profileViews } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;

  const [profile] = await db
    .select({
      id:        profiles.id,
      username:  profiles.username,
      bio:       profiles.bio,
      avatarUrl: profiles.avatarUrl,
      isPublic:  profiles.isPublic,
    })
    .from(profiles)
    .where(eq(profiles.username, username))
    .limit(1);

  if (!profile) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // Total views + unique countries (public stats)
  const [viewStats] = await db
    .select({
      totalViews:      sql<number>`COUNT(*)::int`,
      uniqueCountries: sql<number>`COUNT(DISTINCT ${profileViews.countryCode})::int`,
    })
    .from(profileViews)
    .where(eq(profileViews.profileUserId, profile.id));

  // Views this week
  const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString();
  const [weekStats] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(profileViews)
    .where(
      sql`${profileViews.profileUserId} = ${profile.id} AND ${profileViews.viewedAt} >= ${weekAgo}`,
    );

  return Response.json({
    id:             profile.id,
    username:       profile.username,
    bio:            profile.bio,
    avatarUrl:      profile.avatarUrl,
    isPublic:       profile.isPublic,
    totalViews:     viewStats?.totalViews ?? 0,
    viewsThisWeek:  weekStats?.count ?? 0,
    uniqueCountries: (viewStats?.uniqueCountries ?? 0) > 0 ? viewStats?.uniqueCountries : undefined,
  });
}
