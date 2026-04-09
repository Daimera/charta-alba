-- Hotfix: add preferred_language to profiles if not already present.
-- Safe to run multiple times (ADD COLUMN IF NOT EXISTS).
-- Root cause: 20260404120000_compliance_i18n.sql was not listed in DEPLOY.md
-- and was never applied to the Neon production database.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS preferred_language text NOT NULL DEFAULT 'en';
