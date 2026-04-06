import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rememberDevices } from "@/lib/db/schema";
import { randomBytes, createHash } from "crypto";
import { getIpFromRequest } from "@/lib/rate-limit";
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

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const userAgent = req.headers.get("user-agent") ?? "";
  const ip = getIpFromRequest(req);

  await db.insert(rememberDevices).values({
    userId:          session.user.id,
    deviceTokenHash: tokenHash,
    deviceName:      parseDeviceName(userAgent),
    userAgent,
    ipAddress:       ip,
    expiresAt,
  });

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
