/**
 * IP Geolocation using geoip-lite.
 * Works offline from a local MaxMind database bundled with the package.
 * Update weekly: node -e "require('geoip-lite').startWatchingDataUpdate()"
 */

import geoip from "geoip-lite";

export interface GeoLocation {
  country: string;
  countryCode: string;
  region: string;
  city: string;
  timezone: string;
  lat: number;
  lon: number;
}

const LOCAL_RESULT: GeoLocation = {
  country: "Local",
  countryCode: "XX",
  region: "Local",
  city: "Local",
  timezone: "UTC",
  lat: 0,
  lon: 0,
};

/** ISO country code → flag emoji */
export function countryFlag(code: string): string {
  if (!code || code.length !== 2) return "🌍";
  return code
    .toUpperCase()
    .replace(/./g, (ch) => String.fromCodePoint(0x1f1e6 + ch.charCodeAt(0) - 65));
}

/** Mask an IP address for display: 192.168.1.100 → 192.168.x.x */
export function maskIp(ip: string): string {
  if (!ip || ip === "unknown") return "Unknown";
  const parts = ip.split(".");
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.x.x`;
  // IPv6 — mask last 4 groups
  const v6Parts = ip.split(":");
  if (v6Parts.length > 2) return v6Parts.slice(0, 4).join(":") + ":…";
  return "…";
}

/** Extract the real client IP from Next.js request headers. */
export function extractIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/** Look up geo data for an IP address. Returns null if not found. */
export function getLocationFromIP(ip: string): GeoLocation | null {
  // localhost / private ranges
  if (
    ip === "::1" ||
    ip === "127.0.0.1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.16.") ||
    ip === "unknown"
  ) {
    return LOCAL_RESULT;
  }

  const geo = geoip.lookup(ip);
  if (!geo) return null;

  return {
    country: geo.country ?? "",
    countryCode: geo.country ?? "",
    region: Array.isArray(geo.region) ? geo.region[0] ?? "" : (geo.region ?? ""),
    city: geo.city ?? "",
    timezone: geo.timezone ?? "",
    lat: Array.isArray(geo.ll) ? (geo.ll[0] ?? 0) : 0,
    lon: Array.isArray(geo.ll) ? (geo.ll[1] ?? 0) : 0,
  };
}
