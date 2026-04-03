/**
 * Founder Designation Script
 * Run once to designate the founder account.
 *
 * Usage:
 *   tsx --env-file=.env.local scripts/designate-founder.ts your@email.com
 *
 * Outputs:
 *   - TOTP secret (scan QR code with Google Authenticator)
 *   - 10 backup codes (PRINT AND STORE OFFLINE — never shown again)
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import * as schema from "../src/lib/db/schema";
import qrcode from "qrcode";
import { hash } from "bcryptjs";
import crypto from "crypto";

// ── Inline base32 + TOTP helpers ──────────────────────────────────────────────

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buf: Buffer): string {
  let result = "";
  let bits = 0;
  let value = 0;
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) { result += B32[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) result += B32[(value << (5 - bits)) & 31];
  return result;
}

// ── Inline encrypt (can't import lib/founder-auth directly in script context) ──

function encryptTotpSecret(plain: string): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET not set");
  const key = crypto.scryptSync(secret, "founder-totp-v1", 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("hex"), tag.toString("hex"), encrypted.toString("hex")].join(":");
}

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

function generateBackupCode(): string {
  const words: string[] = [];
  for (let i = 0; i < 6; i++) {
    words.push(WORDLIST[crypto.randomInt(0, WORDLIST.length)]);
  }
  return words.join("-");
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: tsx --env-file=.env.local scripts/designate-founder.ts your@email.com");
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) { console.error("DATABASE_URL not set"); process.exit(1); }
  if (!process.env.NEXTAUTH_SECRET) { console.error("NEXTAUTH_SECRET not set"); process.exit(1); }

  const db = drizzle(neon(databaseUrl), { schema });

  // ── 1. Verify user exists ──────────────────────────────────────────────────
  const [user] = await db
    .select({ id: schema.users.id, email: schema.users.email, isFounder: schema.users.isFounder })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);

  if (!user) {
    console.error(`❌ No user found with email: ${email}`);
    console.error("   The user must sign up first, then run this script.");
    process.exit(1);
  }

  // ── 2. Check no founder exists (DB constraint also enforces this) ──────────
  const [existingFounder] = await db
    .select({ id: schema.users.id, email: schema.users.email })
    .from(schema.users)
    .where(eq(schema.users.isFounder, true))
    .limit(1);

  if (existingFounder) {
    if (existingFounder.id === user.id) {
      console.error("⚠️  This user is already designated as founder.");
    } else {
      console.error(`❌ A founder already exists: ${existingFounder.email}`);
      console.error("   Only one founder account is permitted.");
    }
    process.exit(1);
  }

  console.log(`\n🔐 Designating ${email} as founder...\n`);

  // ── 3. Generate TOTP secret ────────────────────────────────────────────────
  const totpSecret = base32Encode(crypto.randomBytes(20));
  const encryptedSecret = encryptTotpSecret(totpSecret);

  const otpauthUrl = `otpauth://totp/Charta%20Alba%20Founder:${encodeURIComponent(email)}?secret=${totpSecret}&issuer=ChartaAlba&digits=6&period=30`;

  // ── 4. Generate backup codes ───────────────────────────────────────────────
  const rawCodes: string[] = [];
  const hashedCodes: string[] = [];

  console.log("   Generating 10 backup codes (this takes a few seconds)...");
  for (let i = 0; i < 10; i++) {
    const code = generateBackupCode();
    rawCodes.push(code);
    hashedCodes.push(await hash(code, 12));
    process.stdout.write(".");
  }
  console.log(" done.\n");

  // ── 5. Update DB ───────────────────────────────────────────────────────────
  await db
    .update(schema.users)
    .set({
      isFounder: true,
      founderSince: new Date().toISOString(),
      founderTotpSecret: encryptedSecret,
      founderBackupCodes: hashedCodes,
      founderTotpAttempts: 0,
    })
    .where(eq(schema.users.id, user.id));

  // ── 6. Log to audit_log ────────────────────────────────────────────────────
  await db.insert(schema.auditLog).values({
    actionType: "founder_designated",
    targetType: "user",
    targetId: user.id,
    detail: { email, designatedAt: new Date().toISOString() },
    verificationLevel: 4,
    totpVerified: false,
  });

  // ── 7. Print QR code ───────────────────────────────────────────────────────
  console.log("═".repeat(72));
  console.log("  STEP 1 — SCAN THIS QR CODE WITH GOOGLE AUTHENTICATOR");
  console.log("═".repeat(72));
  console.log();

  const qrString = await qrcode.toString(otpauthUrl, { type: "terminal", small: true });
  console.log(qrString);

  console.log("  TOTP Secret (manual entry if QR fails):");
  console.log(`  ${totpSecret}`);
  console.log();

  // ── 8. Print backup codes ──────────────────────────────────────────────────
  console.log("═".repeat(72));
  console.log("  STEP 2 — WRITE DOWN THESE BACKUP CODES AND STORE OFFLINE");
  console.log("  ⚠️  These will NEVER be shown again. Each code is one-time use.");
  console.log("═".repeat(72));
  console.log();
  rawCodes.forEach((code, i) => {
    console.log(`  ${String(i + 1).padStart(2, " ")}. ${code}`);
  });
  console.log();
  console.log("  ▶ Write these on paper and store in a safe, offline location.");
  console.log("  ▶ Do NOT store them digitally or share them.");
  console.log("  ▶ Each code can only be used once.");
  console.log("  ▶ At 5 remaining codes, you will receive a critical alert email.");
  console.log();

  console.log("═".repeat(72));
  console.log("  ✅ FOUNDER DESIGNATION COMPLETE");
  console.log("═".repeat(72));
  console.log();
  console.log(`  Account: ${email}`);
  console.log(`  User ID: ${user.id}`);
  console.log(`  Time:    ${new Date().toUTCString()}`);
  console.log();
  console.log("  Next steps:");
  console.log("  1. Scan the QR code above with Google Authenticator");
  console.log("  2. Store your backup codes safely (offline only)");
  console.log("  3. Sign in at /auth/signin, then navigate to /founder");
  console.log("  4. Enter your 6-digit code at /founder/verify");
  console.log("  5. Welcome to God Mode.");
  console.log();
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
