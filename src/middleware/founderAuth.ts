/**
 * Founder authentication middleware utility.
 *
 * Import `authenticateFounder` in API route handlers — it is NOT the
 * Next.js root middleware file. It wraps request auth checks for all
 * /api/founder/* routes and the founder API key bypass.
 *
 * Usage in route handlers:
 *   const fa = await authenticateFounder(req, 2);
 *   if (!fa.ok) return fa.response;
 *   // proceed with fa.founderId
 */

export {
  authenticateFounder,
  verifyFounderApiKey,
  CRITICAL_PHRASE,
  NUCLEAR_PHRASE,
  EMERGENCY_PHRASE,
} from "@/lib/founder-auth";
export type { FounderAuthResult, VerificationLevel } from "@/lib/founder-auth";
