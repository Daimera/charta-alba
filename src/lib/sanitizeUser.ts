/**
 * Strip sensitive fields before returning user objects in API responses.
 * Never expose passwords, TOTP secrets, backup codes, or founder status
 * to the public.
 */

interface RawUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
  createdAt?: string | null;
  // Potentially present — must be stripped
  passwordHash?: unknown;
  founderTotpSecret?: unknown;
  founderBackupCodes?: unknown;
  founderSince?: unknown;
  founderTotpAttempts?: unknown;
  founderLockedUntil?: unknown;
  founderLastVerified?: unknown;
  founderIpWhitelist?: unknown;
  lastTotpCodeHash?: unknown;
  lastTotpUsedAt?: unknown;
  isFounder?: unknown;
  failedLoginCount?: unknown;
  lockedUntil?: unknown;
  [key: string]: unknown;
}

export interface PublicUser {
  id: string;
  name: string | null;
  image: string | null;
  role: string;
  createdAt: string | null;
}

export interface PublicUserWithUsername extends PublicUser {
  username: string | null;
  bio: string | null;
}

/** Return only safe, public-facing fields from a user record. */
export function publicUser(user: RawUser): PublicUser {
  return {
    id: user.id,
    name: user.name ?? null,
    image: user.image ?? null,
    role: user.role ?? "user",
    createdAt: user.createdAt ?? null,
  };
}

/** Verify that no sensitive keys are present in an object (dev/test helper). */
export function assertNoSensitiveFields(obj: Record<string, unknown>): void {
  const forbidden = [
    "passwordHash",
    "founderTotpSecret",
    "founderBackupCodes",
    "lastTotpCodeHash",
    "failedLoginCount",
    "lockedUntil",
  ];
  for (const key of forbidden) {
    if (key in obj) {
      console.error(`[sanitizeUser] Sensitive field "${key}" found in response`);
    }
  }
}
