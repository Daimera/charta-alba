import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ── Suspicious user-agent patterns ────────────────────────────────────────
const BLOCKED_UA_PATTERNS = [
  /sqlmap/i,
  /nikto/i,
  /masscan/i,
  /nessus/i,
  /openvas/i,
  /w3af/i,
  /acunetix/i,
  /burpsuite/i,
  /zgrab/i,
  /nuclei/i,
  /dirbuster/i,
  /gobuster/i,
];

// ── In-memory rate limiter for edge (per-instance, resets on cold start) ──
// Keyed by "route-group:ip"
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function edgeRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count += 1;
  return entry.count <= max;
}

// ── Security headers added to every response ──────────────────────────────
const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  // ── Block suspicious user-agents ────────────────────────────────────────
  const ua = request.headers.get("user-agent") ?? "";
  if (!ua || BLOCKED_UA_PATTERNS.some((re) => re.test(ua))) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // ── Rate limit auth endpoints ────────────────────────────────────────────
  if (pathname === "/api/auth/callback/credentials" || pathname === "/api/auth/signin") {
    // 5 attempts per IP per 15 minutes
    const allowed = edgeRateLimit(`signin:${ip}`, 5, 15 * 60_000);
    if (!allowed) {
      return new NextResponse(
        JSON.stringify({ error: "Too many sign-in attempts. Please wait 15 minutes." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "900",
          },
        },
      );
    }
  }

  // ── Protect /founder routes ────────────────────────────────────────────
  // Handled by server-side auth checks in the route; middleware just adds headers.

  // ── Apply security headers to all responses ────────────────────────────
  const response = NextResponse.next();
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimisation)
     * - favicon.ico, robots.txt, sitemap.xml
     */
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)",
  ],
};
