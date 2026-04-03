/**
 * Founder authentication library.
 * TOTP is implemented directly with Node.js crypto — no external TOTP dep.
 * All founder key crypto, backup code generation, and level checking here.
 */

import crypto from "crypto";
import { compare, hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import {
  CRITICAL_PHRASE,
  EMERGENCY_PHRASE,
  NUCLEAR_PHRASE,
} from "@/lib/founder-constants";

export { CRITICAL_PHRASE, EMERGENCY_PHRASE, NUCLEAR_PHRASE };
export type VerificationLevel = 1 | 2 | 3 | 4;

const TOTP_WINDOW = 1;           // ±1 step (30 s each side)
const TOTP_LOCKOUT_ATTEMPTS = 3;
const TOTP_LOCKOUT_MINUTES = 30;
const SESSION_FRESH_MINUTES = 15;

// ── Base32 helpers (RFC 4648) ────────────────────────────────────────────────

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buf: Buffer): string {
  let result = "";
  let bits = 0;
  let value = 0;
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      result += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) result += B32[(value << (5 - bits)) & 31];
  return result;
}

function base32Decode(encoded: string): Buffer {
  const clean = encoded.toUpperCase().replace(/=/g, "").replace(/\s/g, "");
  const out: number[] = [];
  let bits = 0;
  let value = 0;
  for (const ch of clean) {
    const idx = B32.indexOf(ch);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

// ── TOTP (RFC 6238 / 4226) ────────────────────────────────────────────────────

function totpCode(secret: string, counter: number): string {
  const key = base32Decode(secret);
  const buf = Buffer.alloc(8);
  buf.writeBigInt64BE(BigInt(counter));
  const hmac = crypto.createHmac("sha1", key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    (((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)) %
    1_000_000;
  return String(code).padStart(6, "0");
}

export function generateTotpSecret(): string {
  return base32Encode(crypto.randomBytes(20));
}

export function totpGenerate(secret: string): string {
  return totpCode(secret, Math.floor(Date.now() / 30_000));
}

export function totpVerify(token: string, secret: string): boolean {
  const counter = Math.floor(Date.now() / 30_000);
  for (let w = -TOTP_WINDOW; w <= TOTP_WINDOW; w++) {
    if (totpCode(secret, counter + w) === token) return true;
  }
  return false;
}

export function buildOtpauthUrl(email: string, secret: string): string {
  const label = encodeURIComponent(`Charta Alba:${email}`);
  const issuer = encodeURIComponent("ChartaAlba");
  return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&digits=6&period=30`;
}

// ── TOTP secret encryption (AES-256-GCM) ─────────────────────────────────────

function getDerivedKey(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET not set");
  return crypto.scryptSync(secret, "founder-totp-v1", 32) as Buffer;
}

export function encryptTotpSecret(plain: string): string {
  const key = getDerivedKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("hex"), tag.toString("hex"), encrypted.toString("hex")].join(":");
}

export function decryptTotpSecret(stored: string): string {
  const parts = stored.split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted secret format");
  const [ivHex, tagHex, encHex] = parts;
  const key = getDerivedKey();
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([
    decipher.update(Buffer.from(encHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
}

// ── Backup code generation ─────────────────────────────────────────────────────

const WORDLIST = [
  "alpha","amber","anvil","atlas","badge","blade","blast","blaze","bloom","boost",
  "brave","brick","bridge","brisk","brush","burst","cabin","chain","chart","chase",
  "chief","chill","chord","chrome","civil","clean","clear","cliff","cloud","coast",
  "cobalt","comet","coral","crane","creek","crest","crisp","cross","crown","crush",
  "crystal","curve","dawn","delta","depth","desert","divine","dome","drift","drive",
  "dusk","eagle","earth","ember","epoch","exile","fable","faith","falcon","field",
  "final","flame","flare","flash","fleet","float","flood","focus","forge","forum",
  "frost","fugue","galaxy","ghost","giant","glade","glare","glass","globe","gloom",
  "glory","grace","grain","grand","graph","grasp","gravel","green","grind","grove",
  "guard","guide","guild","haste","haven","heart","herald","hinge","honor","horse",
  "hover","hymn","index","inner","input","ivory","jewel","judge","karma","kayak",
  "kite","lance","laser","latch","layer","light","limit","linen","local","logic",
  "lunar","magic","maple","march","matrix","maze","merge","merit","metal","might",
  "mist","model","moon","mount","myth","nerve","noble","north","notch","novel",
  "ocean","optic","orbit","order","oxide","ozone","panel","patch","pearl","phase",
  "pilot","pivot","pixel","plane","plant","plate","polar","power","prism","probe",
  "proof","prose","pulse","quest","quiet","quota","radar","radio","rapid","realm",
  "relay","reset","ridge","river","robot","rocky","round","royal","ruby","ruler",
  "sabre","saint","scale","scout","serum","seven","shaft","sharp","shell","shield",
  "shore","sigma","silver","slate","solar","sonic","soul","south","spark","speed",
  "spire","split","squad","staff","stake","stark","start","steam","steel","stern",
  "stone","storm","story","strain","strike","study","style","surge","swift","sword",
  "sync","talon","thorn","thunder","token","torch","trace","track","trade","trail",
  "trust","truth","ultra","unity","valor","vault","verse","viola","voice","vortex",
];

export function generateBackupCode(): string {
  return Array.from({ length: 6 }, () => WORDLIST[crypto.randomInt(0, WORDLIST.length)]).join("-");
}

export async function generateBackupCodes(count = 10): Promise<{ raw: string[]; hashed: string[] }> {
  const raw = Array.from({ length: count }, () => generateBackupCode());
  const hashed = await Promise.all(raw.map((c) => hash(c, 12)));
  return { raw, hashed };
}

// ── TOTP verification (with lockout + replay prevention) ─────────────────────

export type TotpResult =
  | { ok: true }
  | { ok: false; reason: string; attemptsLeft?: number; lockedUntil?: string };

export async function verifyFounderTotp(userId: string, code: string): Promise<TotpResult> {
  const [founder] = await db
    .select({
      founderTotpSecret: users.founderTotpSecret,
      founderTotpAttempts: users.founderTotpAttempts,
      founderLockedUntil: users.founderLockedUntil,
      lastTotpCodeHash: users.lastTotpCodeHash,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!founder?.founderTotpSecret) return { ok: false, reason: "TOTP not configured" };

  // Lockout check
  if (founder.founderLockedUntil) {
    const until = new Date(founder.founderLockedUntil);
    if (until > new Date()) {
      return { ok: false, reason: `Account locked until ${until.toISOString()}`, lockedUntil: founder.founderLockedUntil };
    }
    await db.update(users).set({ founderTotpAttempts: 0, founderLockedUntil: null }).where(eq(users.id, userId));
  }

  const secret = decryptTotpSecret(founder.founderTotpSecret);
  const isValid = totpVerify(code, secret);

  if (!isValid) {
    const newAttempts = (founder.founderTotpAttempts ?? 0) + 1;
    const shouldLock = newAttempts >= TOTP_LOCKOUT_ATTEMPTS;
    const lockedUntil = shouldLock
      ? new Date(Date.now() + TOTP_LOCKOUT_MINUTES * 60_000).toISOString()
      : null;
    await db.update(users).set({ founderTotpAttempts: newAttempts, founderLockedUntil: lockedUntil }).where(eq(users.id, userId));
    if (shouldLock) return { ok: false, reason: `Too many failed attempts. Locked for ${TOTP_LOCKOUT_MINUTES} minutes.`, lockedUntil: lockedUntil! };
    return { ok: false, reason: "Invalid TOTP code", attemptsLeft: TOTP_LOCKOUT_ATTEMPTS - newAttempts };
  }

  // Replay prevention
  const codeHash = crypto.createHash("sha256").update(code).digest("hex");
  if (founder.lastTotpCodeHash === codeHash) {
    return { ok: false, reason: "TOTP code already used — replay rejected" };
  }

  await db.update(users).set({
    founderTotpAttempts: 0,
    founderLockedUntil: null,
    founderLastVerified: new Date().toISOString(),
    lastTotpCodeHash: codeHash,
    lastTotpUsedAt: new Date().toISOString(),
  }).where(eq(users.id, userId));

  return { ok: true };
}

// ── Backup code verification (one-time use) ────────────────────────────────────

export type BackupCodeResult =
  | { ok: true; codesRemaining: number }
  | { ok: false; reason: string };

export async function verifyBackupCode(userId: string, code: string): Promise<BackupCodeResult> {
  const [founder] = await db
    .select({ founderBackupCodes: users.founderBackupCodes })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const codes = founder?.founderBackupCodes ?? [];
  if (codes.length === 0) return { ok: false, reason: "No backup codes available" };

  let matchIdx = -1;
  for (let i = 0; i < codes.length; i++) {
    if (await compare(code, codes[i])) { matchIdx = i; break; }
  }
  if (matchIdx === -1) return { ok: false, reason: "Invalid backup code" };

  const remaining = codes.filter((_, i) => i !== matchIdx);
  await db.update(users).set({ founderBackupCodes: remaining }).where(eq(users.id, userId));

  return { ok: true, codesRemaining: remaining.length };
}

// ── Verification level checking ───────────────────────────────────────────────

function isTotpFresh(lastVerified: string | null): boolean {
  if (!lastVerified) return false;
  return Date.now() - new Date(lastVerified).getTime() < SESSION_FRESH_MINUTES * 60_000;
}

export type FounderAuthResult =
  | { ok: true; founderId: string; level: VerificationLevel }
  | { ok: false; response: Response };

export async function authenticateFounder(
  req: Request,
  requiredLevel: VerificationLevel,
  body?: Record<string, unknown>,
): Promise<FounderAuthResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, response: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!session.user.isFounder) {
    return { ok: false, response: Response.json({ error: "Not found" }, { status: 404 }) };
  }

  const founderId = session.user.id;
  if (requiredLevel === 1) return { ok: true, founderId, level: 1 };

  const [founder] = await db
    .select({ founderLastVerified: users.founderLastVerified, founderIpWhitelist: users.founderIpWhitelist })
    .from(users)
    .where(eq(users.id, founderId))
    .limit(1);

  if (!isTotpFresh(founder?.founderLastVerified ?? null)) {
    return {
      ok: false,
      response: Response.json(
        { error: "TOTP verification required", redirect: "/founder/verify" },
        { status: 403 },
      ),
    };
  }

  // IP whitelist check
  const whitelist = founder?.founderIpWhitelist ?? [];
  if (whitelist.length > 0) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
    if (!whitelist.includes(ip)) {
      return { ok: false, response: Response.json({ error: "IP not whitelisted" }, { status: 403 }) };
    }
  }

  if (requiredLevel === 2) return { ok: true, founderId, level: 2 };

  // Level 3+: confirmation phrase
  const phrase = (body?.confirmPhrase as string | undefined)?.trim();
  if (phrase !== CRITICAL_PHRASE) {
    return { ok: false, response: Response.json({ error: "Confirmation phrase required" }, { status: 403 }) };
  }
  if (requiredLevel === 3) return { ok: true, founderId, level: 3 };

  // Level 4: backup code
  const backupCode = (body?.backupCode as string | undefined)?.trim();
  if (!backupCode) {
    return { ok: false, response: Response.json({ error: "Backup code required for nuclear actions" }, { status: 403 }) };
  }
  const bcResult = await verifyBackupCode(founderId, backupCode);
  if (!bcResult.ok) {
    return { ok: false, response: Response.json({ error: bcResult.reason }, { status: 403 }) };
  }

  return { ok: true, founderId, level: 4 };
}

// ── Founder API key helpers ───────────────────────────────────────────────────

export function generateFounderApiKey(): { raw: string; hash: string; prefix: string } {
  const raw = "ca_founder_" + crypto.randomBytes(32).toString("hex");
  const keyHash = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, hash: keyHash, prefix: raw.slice(0, 20) };
}

export async function verifyFounderApiKey(key: string): Promise<boolean> {
  const { founderApiKey } = await import("@/lib/db/schema");
  const keyHash = crypto.createHash("sha256").update(key).digest("hex");
  const [row] = await db
    .select({ isActive: founderApiKey.isActive })
    .from(founderApiKey)
    .where(eq(founderApiKey.keyHash, keyHash))
    .limit(1);
  if (!row?.isActive) return false;
  db.update(founderApiKey).set({ lastUsedAt: new Date().toISOString() }).where(eq(founderApiKey.keyHash, keyHash)).catch(() => undefined);
  return true;
}
