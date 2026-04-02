import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, profiles } from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await req.json() as {
    name?: string;
    username?: string;
    bio?: string;
    avatarUrl?: string;
    isPublic?: boolean;
    feedAlgorithm?: string;
    emailDigest?: boolean;
    emailComments?: boolean;
  };

  // Update display name on users table
  if (body.name !== undefined) {
    const trimmed = body.name.trim();
    if (!trimmed) {
      return Response.json({ error: "Display name cannot be empty" }, { status: 400 });
    }
    await db.update(users).set({ name: trimmed }).where(eq(users.id, userId));
  }

  // Upsert profile
  const profileUpdates: Record<string, unknown> = {};

  if (body.username !== undefined) {
    const username = body.username.trim();
    if (username) {
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        return Response.json({ error: "Username must be 3–20 characters (letters, numbers, underscores)" }, { status: 400 });
      }
      // Check uniqueness
      const [taken] = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(and(eq(profiles.username, username), ne(profiles.id, userId)))
        .limit(1);
      if (taken) {
        return Response.json({ error: "That username is already taken" }, { status: 409 });
      }
      profileUpdates.username = username;
    } else {
      profileUpdates.username = null;
    }
  }

  if (body.bio !== undefined) profileUpdates.bio = body.bio.trim() || null;
  if (body.avatarUrl !== undefined) profileUpdates.avatarUrl = body.avatarUrl.trim() || null;
  if (body.isPublic !== undefined) profileUpdates.isPublic = body.isPublic;
  if (body.feedAlgorithm !== undefined) {
    const allowed = ["trending", "chronological", "following"];
    if (!allowed.includes(body.feedAlgorithm)) {
      return Response.json({ error: "Invalid feed algorithm" }, { status: 400 });
    }
    profileUpdates.feedAlgorithm = body.feedAlgorithm;
  }
  if (body.emailDigest !== undefined) profileUpdates.emailDigest = body.emailDigest;
  if (body.emailComments !== undefined) profileUpdates.emailComments = body.emailComments;

  if (Object.keys(profileUpdates).length > 0) {
    await db
      .insert(profiles)
      .values({ id: userId, ...profileUpdates })
      .onConflictDoUpdate({ target: profiles.id, set: profileUpdates });
  }

  return Response.json({ ok: true });
}
