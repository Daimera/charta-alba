/**
 * URL validation helpers for user-supplied URLs.
 * Always call these server-side in addition to any client-side checks.
 *
 * Blocks:
 *  - localhost, 127.x.x.x, 0.0.0.0
 *  - Private RFC-1918 ranges: 10.x, 172.16-31.x, 192.168.x
 *  - Link-local: 169.254.x.x
 *  - IPv6 loopback / link-local
 */

const SSRF_HOSTNAME_RE = /^(localhost|0\.0\.0\.0)$/i;

const BLOCKED_IP_PREFIXES = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2[0-9]|3[01])\./,
  /^::1$/,
  /^fe80:/i,
  /^fc00:/i,
  /^fd[0-9a-f]{2}:/i,
];

function isBlockedHost(hostname: string): boolean {
  if (SSRF_HOSTNAME_RE.test(hostname)) return true;
  return BLOCKED_IP_PREFIXES.some((re) => re.test(hostname));
}

/** Allowed video hosts. Returns true for youtube, youtu.be, vimeo. */
export function isAllowedVideoUrl(url: unknown): url is string {
  if (typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    if (isBlockedHost(parsed.hostname)) return false;
    const host = parsed.hostname.toLowerCase();
    return (
      host === "www.youtube.com" ||
      host === "youtube.com" ||
      host === "youtu.be" ||
      host === "www.vimeo.com" ||
      host === "vimeo.com" ||
      host === "player.vimeo.com"
    );
  } catch {
    return false;
  }
}

/**
 * Allowed image/avatar URLs.
 * Requires https:// and blocks internal IP ranges.
 */
export function isAllowedImageUrl(url: unknown): url is string {
  if (typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    if (isBlockedHost(parsed.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}
