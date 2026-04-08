import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, profiles } from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { isAllowedImageUrl } from "@/lib/validateUrl";

export async function PATCH(req: Request) {
  try {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await req.json() as {
    name?: string;
    username?: string;
    phone?: string;
    bio?: string;
    avatarUrl?: string;
    isPublic?: boolean;
    feedAlgorithm?: string;
    emailDigest?: boolean;
    emailComments?: boolean;
    preferredLanguage?: string;
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

  if (body.phone !== undefined) {
    const phone = body.phone.trim() || null;
    if (phone && !/^\+?[\d\s\-().]{7,20}$/.test(phone)) {
      return Response.json({ error: "Invalid phone number format" }, { status: 400 });
    }
    profileUpdates.phone = phone;
  }
  if (body.bio !== undefined) profileUpdates.bio = body.bio.trim() || null;
  if (body.avatarUrl !== undefined) {
    const url = body.avatarUrl.trim();
    if (url && !isAllowedImageUrl(url)) {
      return Response.json({ error: "Avatar URL must use https:// and cannot be an internal address" }, { status: 400 });
    }
    profileUpdates.avatarUrl = url || null;
  }
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
  if (body.preferredLanguage !== undefined) {
    const VALID_LANGS = ["en","es","fr","de","pt","ar","hi","ja","ko","zh-CN","zh-TW","ru","it","nl","tr","pl","sv","id","vi","th"];
    if (!VALID_LANGS.includes(body.preferredLanguage)) {
      return Response.json({ error: "Unsupported language" }, { status: 400 });
    }
    profileUpdates.preferredLanguage = body.preferredLanguage;
  }

  if (Object.keys(profileUpdates).length > 0) {
    await db
      .insert(profiles)
      .values({ id: userId, ...profileUpdates })
      .onConflictDoUpdate({ target: profiles.id, set: profileUpdates });
  }

  return Response.json({ ok: true });
  } catch (err) {
    console.error("[api/settings/profile]", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
