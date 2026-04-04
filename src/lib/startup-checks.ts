/**
 * Startup validation — imported in layout.tsx so it runs on every cold start.
 * Throws hard errors for missing or misconfigured secrets so deployment
 * fails loudly instead of silently running in an insecure state.
 */

export function runStartupChecks(): void {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "NEXTAUTH_SECRET too short or missing. " +
        "Generate one with: openssl rand -base64 32",
    );
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set.");
  }
}

// Run immediately when this module is imported
runStartupChecks();
