import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { contentViews } from "@/lib/db/schema";
import { and, eq, gte, sql } from "drizzle-orm";
import { getLocationFromIP, extractIp } from "@/lib/geo";
import { parseUserAgent } from "@/lib/ua";

/** POST — record a content view (paper / video / card). */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  const ip = extractIp(req);
  const ua = req.headers.get("user-agent") ?? null;

  const body = await req.json().catch(() => ({})) as { type?: string };
  const contentType = body.type ?? "card";
  if (!["paper", "video", "card"].includes(contentType)) {
    return Response.json({ error: "Invalid type" }, { status: 400 });
  }

  // Dedup: same IP + content within 1 hour
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const [existing] = await db
    .select({ id: contentViews.id })
    .from(contentViews)
    .where(
      and(
        eq(contentViews.contentType, contentType),
        eq(contentViews.contentId, id),
        eq(contentViews.viewerIp, ip),
        gte(contentViews.viewedAt, hourAgo),
      ),
    )
    .limit(1);

  if (!existing) {
    const geo = getLocationFromIP(ip);
    const device = parseUserAgent(ua);
    await db.insert(contentViews).values({
      contentType,
      contentId:    id,
      viewerUserId: session?.user?.id ?? null,
      viewerIp:     ip,
      country:      geo?.country ?? null,
      countryCode:  geo?.countryCode ?? null,
      city:         geo?.city ?? null,
      deviceType:   device.deviceType,
    });
  }

  // Return unique view count for this content
  const [row] = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${contentViews.viewerIp})::int` })
    .from(contentViews)
    .where(
      and(
        eq(contentViews.contentType, contentType),
        eq(contentViews.contentId, id),
      ),
    );

  return Response.json({ views: row?.count ?? 0 });
}

/** GET — return public view count for a piece of content. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = new URL(_req.url);
  const contentType = searchParams.get("type") ?? "card";

  const [row] = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${contentViews.viewerIp})::int` })
    .from(contentViews)
    .where(
      and(
        eq(contentViews.contentType, contentType),
        eq(contentViews.contentId, id),
      ),
    );

  return Response.json({ views: row?.count ?? 0 });
}
