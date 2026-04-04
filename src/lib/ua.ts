/**
 * User-agent parsing helpers using ua-parser-js.
 */

import { UAParser } from "ua-parser-js";

export interface ParsedUA {
  deviceType: "mobile" | "tablet" | "desktop";
  browser: string;
  os: string;
}

/** Parse a user-agent string into structured device/browser/OS info. */
export function parseUserAgent(userAgent: string | null | undefined): ParsedUA {
  if (!userAgent) return { deviceType: "desktop", browser: "Unknown", os: "Unknown" };

  const parser = new UAParser(userAgent);
  const device = parser.getDevice();
  const browser = parser.getBrowser();
  const os = parser.getOS();

  let deviceType: ParsedUA["deviceType"] = "desktop";
  if (device.type === "mobile") deviceType = "mobile";
  else if (device.type === "tablet") deviceType = "tablet";

  return {
    deviceType,
    browser: browser.name ?? "Unknown",
    os: os.name ?? "Unknown",
  };
}
