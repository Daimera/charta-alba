import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { privacyRequests } from "@/lib/db/schema";
import { checkRateLimit, getIpFromRequest } from "@/lib/rate-limit";
import { sanitizeString } from "@/lib/sanitize";

const ALLOWED_TYPES = [
  "download",
  "delete",
  "correct",
  "opt_out_analytics",
  "ccpa_do_not_sell",
  "other",
] as const;
type RequestType = (typeof ALLOWED_TYPES)[number];

function isValidEmail(s: unknown): s is string {
  if (typeof s !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

export async function POST(req: Request) {
  try {
    const ip = getIpFromRequest(req);
    const rl = checkRateLimit(`privacy-request:${ip}`, 3, 60 * 60 * 1000); // 3 per hour
    if (!rl.allowed) {
      return Response.json(
        { error: "Too many requests. Please wait before submitting again." },
        {
          status: 429,
          headers: { "Retry-After": String(rl.retryAfterSeconds) },
        }
      );
    }

    const session = await auth();
    const body = await req.json() as { type?: unknown; email?: unknown; notes?: unknown };

    // Validate request type
    if (!body.type || !ALLOWED_TYPES.includes(body.type as RequestType)) {
      return Response.json({ error: "Invalid request type" }, { status: 400 });
    }

    // Validate email
    if (!isValidEmail(body.email)) {
      return Response.json({ error: "A valid email address is required" }, { status: 400 });
    }

    const notes = sanitizeString(body.notes, 2000);

    await db.insert(privacyRequests).values({
      userId: session?.user?.id ?? null,
      requestType: body.type as RequestType,
      requesterEmail: (body.email as string).trim().toLowerCase(),
      notes: notes ?? null,
      ipAddress: ip,
      status: "pending",
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[api/privacy/request]", err);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
