# Charta Alba — Production Deployment Guide

## Prerequisites
- Vercel account (free tier is fine)
- Neon account (free tier: 0.5 GB)
- Google Cloud Console project
- Resend account (free tier: 3,000 emails/month)
- Domain pointing to Vercel (optional but recommended)

---

## 1. Neon Database Setup

1. Create a new project at https://console.neon.tech
2. Copy the **pooled** connection string (ends in `-pooler.us-east-2.aws.neon.tech`)
3. Run all migrations in order against your production database:

```bash
# Install the Neon CLI or use the Neon console SQL editor
# Run each migration file in supabase/migrations/ in timestamp order:

psql "$DATABASE_URL" -f supabase/migrations/20260328000000_initial_schema.sql
psql "$DATABASE_URL" -f supabase/migrations/20260329000000_neon_full_schema.sql
psql "$DATABASE_URL" -f supabase/migrations/20260329000000_competitive_features.sql
psql "$DATABASE_URL" -f supabase/migrations/20260329120000_phase2_features.sql
psql "$DATABASE_URL" -f supabase/migrations/20260329130000_videos_auth_settings.sql
psql "$DATABASE_URL" -f supabase/migrations/20260401000000_settings_circles_expansion.sql
psql "$DATABASE_URL" -f supabase/migrations/20260402000000_api_platform.sql
psql "$DATABASE_URL" -f supabase/migrations/20260402120000_points_system.sql
psql "$DATABASE_URL" -f supabase/migrations/20260403000000_founder_system.sql
psql "$DATABASE_URL" -f supabase/migrations/20260403120000_location_analytics.sql
psql "$DATABASE_URL" -f supabase/migrations/20260404000000_account_lockout.sql
psql "$DATABASE_URL" -f supabase/migrations/20260404120000_compliance_i18n.sql
psql "$DATABASE_URL" -f supabase/migrations/20260404180000_sessions4_8.sql
psql "$DATABASE_URL" -f supabase/migrations/20260405000000_subscription_tier.sql
psql "$DATABASE_URL" -f supabase/migrations/20260405010000_remember_devices.sql
psql "$DATABASE_URL" -f supabase/migrations/20260408000000_profiles_phone.sql
psql "$DATABASE_URL" -f supabase/migrations/20260409000000_preferred_language_hotfix.sql
```

> **Tip:** You can paste each file's contents directly into the Neon Console SQL Editor at https://console.neon.tech if you don't have `psql` installed.

---

## 2. Google OAuth Setup

1. Go to https://console.cloud.google.com
2. Select or create a project
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client IDs**
5. Application type: **Web application**
6. Add Authorized redirect URI:
   ```
   https://chartaalba.com/api/auth/callback/google
   ```
   (Also add `http://localhost:3000/api/auth/callback/google` for local dev)
7. Copy the **Client ID** and **Client Secret**

---

## 3. Resend Email Setup

1. Sign up at https://resend.com
2. Add your domain (e.g. `chartaalba.com`) under **Domains**
3. Add the DNS records Resend provides (SPF, DKIM, DMARC)
4. Once verified, create an **API Key** with Send access
5. The `from` address is already set to `noreply@chartaalba.com` in `src/lib/email.ts`

---

## 4. Vercel Deployment

### Environment Variables

Set all of the following in **Vercel Dashboard → Project → Settings → Environment Variables**:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Neon pooled connection string |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://chartaalba.com` (your production URL) |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `ANTHROPIC_API_KEY` | From https://console.anthropic.com |
| `CRON_SECRET` | `openssl rand -hex 32` |
| `RESEND_API_KEY` | From Resend dashboard |

### NEXTAUTH_URL — Critical

`NEXTAUTH_URL` must match the **exact** URL Vercel assigns your project. If you
haven't added a custom domain yet, this will be the Vercel preview URL:

```
https://charta-alba.vercel.app
```

Set it to your custom domain once DNS is live (e.g. `https://chartaalba.com`).

> **Important:** After adding or changing any environment variable in the Vercel
> dashboard you **must redeploy** for it to take effect. Either push a new commit
> or use **Vercel Dashboard → Project → Deployments → Redeploy** on the latest
> deployment. Variables are baked in at build/deploy time, not read at runtime.

---

### Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (first time — follow prompts to link project)
vercel --prod

# Subsequent deploys happen automatically on git push to main
```

### Vercel Cron Job

The cron job is defined in `vercel.json` and runs daily at 06:00 UTC:

```json
{
  "crons": [{ "path": "/api/cron/seed", "schedule": "0 6 * * *" }]
}
```

Vercel will automatically call `/api/cron/seed` with the `Authorization: Bearer $CRON_SECRET` header. The route validates this header before running.

---

## 5. First arXiv Seed

After deploying, trigger an immediate seed to populate the feed:

```bash
# Replace with your actual production URL and CRON_SECRET
curl -X POST https://chartaalba.com/api/cron/seed \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Or trigger it from the Vercel Dashboard under **Project → Cron Jobs**.

---

## 6. DNS / Domain Setup (Vercel)

1. In Vercel Dashboard → Project → Settings → Domains, add `chartaalba.com`
2. Add the CNAME or A records Vercel provides to your DNS registrar
3. Vercel automatically provisions a TLS certificate

---

## 7. Post-Deploy Checklist

- [ ] All 6 migrations applied to Neon prod database
- [ ] All env vars set in Vercel dashboard
- [ ] Google OAuth redirect URI added for production domain
- [ ] Resend domain DNS verified
- [ ] First seed triggered and cards visible in feed
- [ ] Sign-in with Google works end-to-end
- [ ] Email (password reset, email change) delivers correctly
- [ ] Vercel cron job listed under Project → Cron Jobs
- [ ] `NEXTAUTH_URL` set to production URL (not localhost)

---

## Local Development

```bash
cp .env.example .env.local
# Fill in your values

npm install
npm run dev
```

The app runs at http://localhost:3000. Without `RESEND_API_KEY`, emails are printed to the console.
