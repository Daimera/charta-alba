import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

const VALID_PERMS = ["everyone", "followers", "nobody"];

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    isPublic?: boolean;
    commentPermission?: string;
    dmPermission?: string;
    markSensitive?: boolean;
    hiddenReplies?: boolean;
    shareLocationWithCreators?: boolean;
  };

  if (body.commentPermission !== undefined && !VALID_PERMS.includes(body.commentPermission)) {
    return Response.json({ error: "Invalid commentPermission" }, { status: 400 });
  }
  if (body.dmPermission !== undefined && !VALID_PERMS.includes(body.dmPermission)) {
    return Response.json({ error: "Invalid dmPermission" }, { status: 400 });
  }

  const set: Record<string, unknown> = {};
  if (body.isPublic !== undefined) set.isPublic = body.isPublic;
  if (body.commentPermission !== undefined) set.commentPermission = body.commentPermission;
  if (body.dmPermission !== undefined) set.dmPermission = body.dmPermission;
  if (body.markSensitive !== undefined) set.markSensitive = body.markSensitive;
  if (body.hiddenReplies !== undefined) set.hiddenReplies = body.hiddenReplies;
  if (body.shareLocationWithCreators !== undefined) set.shareLocationWithCreators = body.shareLocationWithCreators;

  if (Object.keys(set).length === 0) return Response.json({ ok: true });

  await db
    .insert(profiles)
    .values({ id: session.user.id, ...set })
    .onConflictDoUpdate({ target: profiles.id, set });

  return Response.json({ ok: true });
}
