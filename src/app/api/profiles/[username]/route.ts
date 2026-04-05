import { db } from "@/lib/db";
import { profiles, profileViews, users, claims } from "@/lib/db/schema";

import { eq, sql, and } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;

  const [profile] = await db
    .select({
      id:               profiles.id,
      username:         profiles.username,
      bio:              profiles.bio,
      avatarUrl:        profiles.avatarUrl,
      isPublic:         profiles.isPublic,
      followerCount:    profiles.followerCount,
      followingCount:   profiles.followingCount,
      subscriptionTier: profiles.subscriptionTier,
      createdAt:        profiles.createdAt,
    })
    .from(profiles)
    .where(eq(profiles.username, username))
    .limit(1);

  if (!profile) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // Display name from users table
  const [userRow] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, profile.id))
    .limit(1);

  // Total views + unique countries (public stats)
  const [viewStats] = await db
    .select({
      totalViews:      sql<number>`COUNT(*)::int`,
      uniqueCountries: sql<number>`COUNT(DISTINCT ${profileViews.countryCode})::int`,
    })
    .from(profileViews)
    .where(eq(profileViews.profileUserId, profile.id));

  const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString();
  const [weekStats] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(profileViews)
    .where(
      sql`${profileViews.profileUserId} = ${profile.id} AND ${profileViews.viewedAt} >= ${weekAgo}`,
    );

  // Check ORCID verification
  const [claimRow] = await db
    .select({ id: claims.id })
    .from(claims)
    .where(and(eq(claims.userId, profile.id), eq(claims.status, "verified")))
    .limit(1);

  return Response.json({
    id:               profile.id,
    username:         profile.username,
    displayName:      userRow?.name ?? profile.username,
    bio:              profile.bio,
    avatarUrl:        profile.avatarUrl,
    isPublic:         profile.isPublic,
    followerCount:    profile.followerCount,
    followingCount:   profile.followingCount,
    subscriptionTier: profile.subscriptionTier ?? "free",
    joinedAt:         profile.createdAt,
    isOrcidVerified:  !!claimRow,
    totalViews:       viewStats?.totalViews ?? 0,
    viewsThisWeek:    weekStats?.count ?? 0,
    uniqueCountries:  (viewStats?.uniqueCountries ?? 0) > 0 ? viewStats?.uniqueCountries : undefined,
  });
}
