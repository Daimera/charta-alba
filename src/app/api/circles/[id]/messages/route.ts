import { auth } from "@/lib/auth";
import { neon } from "@neondatabase/serverless";
import { assertUUID } from "@/lib/sanitize";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const uuidErr = assertUUID(id);
  if (uuidErr) return uuidErr;

  const sql = neon(process.env.DATABASE_URL!);

  try {
    // Verify membership
    const [member] = await sql`SELECT id FROM circle_members WHERE circle_id = ${id} AND user_id = ${session.user.id} LIMIT 1`;
    if (!member) return Response.json({ error: "Not a member" }, { status: 403 });

    const messages = await sql`
      SELECT
        m.id,
        m.content,
        m.message_type,
        m.media_url,
        m.created_at,
        m.user_id,
        u.name AS author_name,
        u.image AS author_image,
        p.username AS author_username
      FROM circle_messages m
      JOIN users u ON u.id = m.user_id
      LEFT JOIN profiles p ON p.id = m.user_id
      WHERE m.circle_id = ${id}
      ORDER BY m.created_at ASC
      LIMIT 200
    `;
    return Response.json({ messages });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[circles/messages GET]", msg);
    return Response.json({ messages: [] });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const uuidErr = assertUUID(id);
  if (uuidErr) return uuidErr;

  const body = await req.json() as { content?: string; messageType?: string; mediaUrl?: string };
  const content = body.content?.trim();
  if (!content) return Response.json({ error: "Message cannot be empty" }, { status: 400 });
  if (content.length > 2000) return Response.json({ error: "Message too long (max 2000 chars)" }, { status: 400 });

  const sql = neon(process.env.DATABASE_URL!);

  try {
    const [member] = await sql`SELECT id FROM circle_members WHERE circle_id = ${id} AND user_id = ${session.user.id} LIMIT 1`;
    if (!member) return Response.json({ error: "You are not a member of this circle" }, { status: 403 });

    const [msg] = await sql`
      INSERT INTO circle_messages (circle_id, user_id, content, message_type, media_url)
      VALUES (${id}, ${session.user.id}, ${content}, ${body.messageType ?? "text"}, ${body.mediaUrl ?? null})
      RETURNING id, content, message_type, media_url, created_at, user_id
    `;

    return Response.json({
      message: {
        ...msg,
        author_name: session.user.name,
        author_image: session.user.image ?? null,
        author_username: null,
      }
    }, { status: 201 });
  } catch (err) {
    console.error("[circles/messages POST]", err);
    return Response.json({ error: "Failed to send message" }, { status: 500 });
  }
}
