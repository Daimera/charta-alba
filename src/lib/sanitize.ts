/**
 * Input sanitization helpers.
 * Call these at API boundaries before any DB interaction.
 */

const MAX_INPUT_LENGTH = 10_000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

/** Strip null bytes that can confuse parsers / bypass filters. */
export function stripNullBytes(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x00/g, "");
}

/**
 * Sanitize a user-supplied string: strip null bytes and enforce max length.
 * Returns null when the input is falsy.
 */
export function sanitizeString(s: unknown, maxLen = MAX_INPUT_LENGTH): string | null {
  if (typeof s !== "string") return null;
  const stripped = stripNullBytes(s);
  if (stripped.length > maxLen) return null; // treat oversized input as invalid
  return stripped;
}

/**
 * Like sanitizeString but returns a Response-ready error tuple when invalid.
 * Usage: const [clean, err] = requireString(input, 200); if (err) return err;
 */
export function requireString(
  s: unknown,
  maxLen = MAX_INPUT_LENGTH,
): [string, null] | [null, Response] {
  const clean = sanitizeString(s, maxLen);
  if (clean === null) {
    if (typeof s !== "string") {
      return [null, Response.json({ error: "Invalid input" }, { status: 400 })];
    }
    return [null, Response.json({ error: `Input exceeds ${maxLen} character limit` }, { status: 400 })];
  }
  return [clean, null];
}

/** Return true only for valid UUIDs (v4 format). */
export function isValidUUID(s: unknown): s is string {
  return typeof s === "string" && UUID_RE.test(s);
}

/**
 * Assert that a value is a valid UUID, returning an error Response if not.
 * Usage: const err = assertUUID(id); if (err) return err;
 */
export function assertUUID(s: unknown): Response | null {
  if (!isValidUUID(s)) {
    return Response.json({ error: "Invalid ID" }, { status: 400 });
  }
  return null;
}

/** Basic email format validation. */
export function isValidEmail(s: unknown): s is string {
  return typeof s === "string" && EMAIL_RE.test(s) && s.length <= 320;
}
