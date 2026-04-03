# Charta Alba — Founder Account Security Guide

## Overview

The founder account is the highest privilege level in Charta Alba. There is exactly one
founder account, enforced at the database level with a unique partial index. Compromise
of this account would give full access to all user data, system config, and platform
controls. Treat it accordingly.

---

## Part 1 — Designating the Founder Account

### Prerequisites

1. The founder must have a registered Charta Alba account (email + password or Google OAuth)
2. You need local access to the codebase and `.env.local` with `DATABASE_URL` and `NEXTAUTH_SECRET`
3. Google Authenticator (or compatible TOTP app) installed on your phone

### Step-by-Step Designation

```bash
# 1. Ensure the account exists (sign up first at /auth/register if needed)

# 2. Run the designation script
tsx --env-file=.env.local scripts/designate-founder.ts your@email.com
```

The script will:
- Verify the account exists
- Confirm no founder has been designated yet
- Generate a TOTP secret (AES-256-GCM encrypted before DB storage)
- Generate 10 backup codes
- Print a QR code to your terminal
- Print backup codes **once** — they are NEVER stored raw

### Completing Setup

1. **Open Google Authenticator** on your phone
2. **Tap +** → **Scan a QR code**
3. **Scan the QR code** printed in your terminal
4. **Write down your backup codes** on paper — do NOT photograph them
5. **Store backup codes** in at least two separate physical locations (safe, locked drawer, etc.)
6. **Sign in** to Charta Alba as normal
7. **Navigate to `/founder`** — you will be redirected to `/founder/verify`
8. **Enter the 6-digit code** from Google Authenticator
9. You now have Level 2 access to the Founder Console

---

## Part 2 — Verification Levels

| Level | Requirements | Permitted Actions |
|-------|-------------|-------------------|
| **L1** | Founder session active | View dashboard (read-only) |
| **L2** | L1 + TOTP within 15 min | All data views, exports, audit log |
| **L3** | L2 + confirmation phrase | Writes: suspend users, award points, modify config |
| **L4** | L2 + backup code + phrase | Nuclear: rotate founder key, emergency procedures |

The **confirmation phrase** for L3 actions is:
```
I confirm this critical action — Charta Alba
```

---

## Part 3 — If Your Phone Is Lost (Backup Code Procedure)

1. Go to `/founder/verify`
2. You will see a regular TOTP input — but you need to use the backup code flow
3. Contact the backup code recovery page (detailed in your internal runbook)
4. Each backup code is: six words joined by dashes (e.g. `thunder-rabbit-crystal-seven-moon-fire`)
5. Enter the backup code **exactly as written** (lowercase, dashes)
6. The code is immediately invalidated after use — cross it off your physical list
7. **Immediately set up TOTP on a new device** once you regain access:
   - Go to the Founder Console
   - A re-enrollment flow is available (requires L4 with a backup code + phrase)

### Code Count Alerts

| Remaining Codes | Alert |
|-----------------|-------|
| 8 | Warning email sent |
| 5 | Urgent warning email sent |
| 3 | Critical alert — regenerate immediately |
| 0 | Account locked — emergency procedure required |

---

## Part 4 — If Your Email Is Compromised

**Act immediately:**

1. **Change your Charta Alba password** (Settings → Security → Change Password)
2. **Rotate your founder API key** (Founder Console → Overview → Rotate Key)
3. **Review the audit log** (Founder Console → Audit Log) for unauthorized actions
4. If you cannot access your account:
   - Use `/founder/emergency-lock` to immediately lock the founder account
   - Contact your email provider to secure your email
   - Once email is secured, use a backup code to restore founder access

**Email security checklist:**
- Enable 2FA on your email account
- Use a different email for Charta Alba founder account than personal email
- Consider a dedicated, hardware-key-protected email for this account

---

## Part 5 — Suspected Breach Response

### Immediate Actions (within minutes)

1. **Activate emergency lockdown**: Navigate to `/founder/emergency-lock` (no auth required)
   - Type exactly: `LOCK CHARTA ALBA FOUNDER`
   - This locks the account for 30 days, invalidates all sessions, sends alert email
2. **Check the audit log** at your earliest opportunity for what was accessed/changed
3. **Rotate all credentials**:
   - Founder TOTP (re-run designation script after lockout expires)
   - `NEXTAUTH_SECRET` (all sessions invalidated on rotation)
   - `DATABASE_URL` (rotate Neon password)
   - `ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`, all env vars
4. **Notify affected users** if any user data was accessed or modified

### Restoring After Lockdown

1. Wait for lockout to expire OR use a backup code to unlock
2. Navigate to `/founder/verify`
3. The system accepts a backup code in place of TOTP when locked
4. Immediately review audit log after regaining access
5. Rotate the founder API key (old key is compromised)

### What the Attacker Cannot Do (even with session compromise)

- Run Level 3/4 actions without the confirmation phrase
- Rotate the founder key without the phrase
- Bypass backup code requirement for nuclear actions
- Modify the audit log (immutable DB trigger)
- Delete the points ledger (immutable DB trigger)
- Create a second founder account (unique partial index at DB level)

---

## Part 6 — Quarterly Security Review Checklist

Run this review every 90 days:

### Authentication

- [ ] Confirm TOTP app still works (generate and verify a code)
- [ ] Count remaining backup codes — order as written on physical copy
- [ ] If any codes were used, note why and consider regenerating
- [ ] Review founder login IPs in audit log — any unrecognized locations?
- [ ] Check `founder_totp_attempts` in DB — any recent failed attempts?

### Access Review

- [ ] Review last 90 days of audit log at `/founder/audit`
- [ ] Verify no unexpected admin role grants (`founder_role_changed` events)
- [ ] Verify no unexpected point awards (`founder_points_manual_award` events)
- [ ] Check all API keys — any keys for users who should no longer have access?
- [ ] Review config changes (`founder_config_updated` events)

### Infrastructure

- [ ] Rotate `NEXTAUTH_SECRET` if it has been used for >1 year
- [ ] Rotate `DATABASE_URL` password
- [ ] Review Vercel environment variables — who has access to the project?
- [ ] Review Stripe dashboard — any unexpected charges or refunds?
- [ ] Check for any new team members with Vercel/Neon/GitHub access

### Backup Codes

- [ ] Confirm physical copies are in their designated locations and legible
- [ ] Confirm no copies exist in digital form (photos, notes apps, email)
- [ ] If storing in multiple locations, verify all copies are intact

### Documentation

- [ ] Update this document if any procedures have changed
- [ ] Update internal runbook with any incidents from the past quarter
- [ ] Review `.env.example` — are all required vars documented?

---

## Part 7 — Emergency Contacts and Procedures

### If Account Is Unrecoverable

If all backup codes are exhausted and TOTP device is lost and email is compromised:

1. **Database-level recovery** (requires Neon dashboard access):
   ```sql
   -- Only run this if you have Neon project owner access
   -- This bypasses all application-level security
   UPDATE users
   SET founder_locked_until = NULL,
       founder_totp_attempts = 0,
       founder_backup_codes = NULL,
       founder_totp_secret = NULL,
       is_founder = FALSE
   WHERE is_founder = TRUE;
   ```
2. Re-run `scripts/designate-founder.ts` with a fresh TOTP setup
3. Rotate ALL credentials as described in Part 5

### Service-Level Contacts

| Service | Emergency Access |
|---------|-----------------|
| **Neon** (database) | dashboard.neon.tech → project owner |
| **Vercel** (hosting) | vercel.com → team settings |
| **Stripe** (payments) | dashboard.stripe.com |
| **Resend** (email) | resend.com → API keys |

---

## Part 8 — Security Architecture Notes

### What Is Encrypted / Hashed

| Data | Method |
|------|--------|
| TOTP secret | AES-256-GCM, key derived from NEXTAUTH_SECRET via scrypt |
| Backup codes | bcrypt, cost factor 12 (stored as one-way hashes) |
| Passwords | bcrypt, cost factor 12 |
| API keys | SHA-256 (stored as hash, never raw) |

### Immutability Guarantees

The following tables have PostgreSQL-level immutability triggers — even a compromised
service role cannot delete or modify rows:

- `audit_log` — complete founder action history
- `points_ledger` — complete points transaction history

### Single-Founder Enforcement

The `only_one_founder` partial unique index on `users (is_founder) WHERE is_founder = TRUE`
makes it physically impossible at the DB level to have two founder accounts, regardless
of application code.

---

*Last updated: 2026-04-03*
*Treat this document as sensitive — do not commit with real credentials or backup codes*
