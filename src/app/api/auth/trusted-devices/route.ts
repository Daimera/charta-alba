import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rememberDevices } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date().toISOString();
  const rows = await db
    .select({
      id:          rememberDevices.id,
      deviceName:  rememberDevices.deviceName,
      city:        rememberDevices.city,
      country:     rememberDevices.country,
      lastUsedAt:  rememberDevices.lastUsedAt,
      createdAt:   rememberDevices.createdAt,
    })
    .from(rememberDevices)
    .where(
      and(
        eq(rememberDevices.userId, session.user.id),
        gt(rememberDevices.expiresAt, now),
      ),
    )
    .orderBy(rememberDevices.lastUsedAt);

  return Response.json({ devices: rows });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db
    .delete(rememberDevices)
    .where(eq(rememberDevices.userId, session.user.id));

  return Response.json({ ok: true });
}
