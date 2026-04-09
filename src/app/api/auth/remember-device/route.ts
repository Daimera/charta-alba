import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rememberDevices } from "@/lib/db/schema";
import { randomBytes, createHash } from "crypto";
import { getIpFromRequest } from "@/lib/rate-limit";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

function parseDeviceName(ua: string): string {
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  if (/Android/i.test(ua)) return "Android device";
  if (/Windows/i.test(ua)) return "Windows PC";
  if (/Macintosh/i.test(ua)) return "Mac";
  if (/Linux/i.test(ua)) return "Linux device";
  return "Unknown device";
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userAgent = req.headers.get("user-agent") ?? "";
  const ip = getIpFromRequest(req);
  // Check for an existing record for this user + UA fingerprint to prevent duplicates
  const existing = await db
    .select({ id: rememberDevices.id })
    .from(rememberDevices)
    .where(and(
      eq(rememberDevices.userId, session.user.id),
      eq(rememberDevices.userAgent, userAgent),
    ))
    .limit(1);

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  if (existing.length > 0) {
    // Rotate the token and refresh expiry for the existing device record
    await db
      .update(rememberDevices)
      .set({ deviceTokenHash: tokenHash, ipAddress: ip, expiresAt, lastUsedAt: new Date().toISOString() })
      .where(eq(rememberDevices.id, existing[0].id));
  } else {
    await db.insert(rememberDevices).values({
      userId:          session.user.id,
      deviceTokenHash: tokenHash,
      deviceName:      parseDeviceName(userAgent),
      userAgent,
      ipAddress:       ip,
      expiresAt,
    });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("ca_device", rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });
  return res;
}
