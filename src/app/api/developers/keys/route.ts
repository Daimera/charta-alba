import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { generateApiKey } from "@/lib/api-auth";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const keys = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      tier: apiKeys.tier,
      requestsThisMonth: apiKeys.requestsThisMonth,
      requestsToday: apiKeys.requestsToday,
      lastUsedAt: apiKeys.lastUsedAt,
      isActive: apiKeys.isActive,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.userId, session.user.id))
    .orderBy(apiKeys.createdAt);

  return Response.json({ keys });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { name?: string };
  const name = body.name?.trim();
  if (!name) return Response.json({ error: "Key name is required" }, { status: 400 });
  if (name.length > 50) return Response.json({ error: "Name must be 50 characters or fewer" }, { status: 400 });

  // Limit: max 5 active keys per user
  const existing = await db
    .select({ id: apiKeys.id })
    .from(apiKeys)
    .where(eq(apiKeys.userId, session.user.id));

  if (existing.length >= 5) {
    return Response.json({ error: "Maximum 5 API keys per account" }, { status: 400 });
  }

  const { raw, hash, prefix } = generateApiKey();

  const [created] = await db
    .insert(apiKeys)
    .values({
      userId: session.user.id,
      name,
      keyHash: hash,
      keyPrefix: prefix,
      tier: "free",
    })
    .returning({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      tier: apiKeys.tier,
      createdAt: apiKeys.createdAt,
    });

  // Return the raw key ONCE — never stored, never shown again
  return Response.json({ key: { ...created, rawKey: raw } }, { status: 201 });
}
