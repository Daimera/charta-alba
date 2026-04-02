import { db } from "@/lib/db";
import { users, profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";

export async function POST(req: Request) {
  const body = await req.json() as {
    email?: string;
    password?: string;
    name?: string;
  };

  const { email, password, name } = body;

  if (!email?.trim() || !password || !name?.trim()) {
    return Response.json({ error: "All fields are required" }, { status: 400 });
  }

  if (password.length < 8) {
    return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const emailLower = email.trim().toLowerCase();

  // Check if email already exists
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, emailLower))
    .limit(1);

  if (existing) {
    return Response.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const passwordHash = await hash(password, 12);

  const [user] = await db
    .insert(users)
    .values({
      email: emailLower,
      name: name.trim(),
      passwordHash,
    })
    .returning({ id: users.id });

  // Create empty profile
  await db.insert(profiles).values({ id: user.id }).onConflictDoNothing();

  return Response.json({ ok: true }, { status: 201 });
}
