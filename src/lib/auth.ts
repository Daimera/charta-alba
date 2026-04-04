import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { compare } from "bcryptjs";
import { db, getAuthDb } from "@/lib/db";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from "@/lib/db/schema";
import { logAuditFireAndForget } from "@/lib/audit";

const LOCKOUT_THRESHOLD = 10;           // failed attempts before lockout
const LOCKOUT_DURATION_MS = 30 * 60_000; // 30 minutes

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  adapter: DrizzleAdapter(getAuthDb(), {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days for regular users
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      // Fetch role + isFounder from DB on first sign-in (token won't have them yet)
      if (token.sub && !token.role) {
        const [dbUser] = await db
          .select({ role: users.role, isFounder: users.isFounder })
          .from(users)
          .where(eq(users.id, token.sub))
          .limit(1);
        token.role = dbUser?.role ?? "user";
        token.isFounder = dbUser?.isFounder ?? false;
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      if (token.role) session.user.role = token.role as string;
      session.user.isFounder = (token.isFounder ?? false) as boolean;
      return session;
    },
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, (credentials.email as string).toLowerCase()))
          .limit(1);

        if (!user?.passwordHash) return null;

        // Check account lockout
        if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
          return null;
        }

        const valid = await compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!valid) {
          // Increment failed attempts; lock if threshold reached
          const newCount = (user.failedLoginCount ?? 0) + 1;
          const lockedUntil =
            newCount >= LOCKOUT_THRESHOLD
              ? new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString()
              : null;
          await db
            .update(users)
            .set({
              failedLoginCount: newCount,
              ...(lockedUntil ? { lockedUntil } : {}),
            })
            .where(eq(users.id, user.id));

          logAuditFireAndForget({
            actionType: "auth_failed",
            targetType: "user",
            targetId: user.id,
            detail: { email: user.email, attempt: newCount },
          });

          if (lockedUntil) {
            logAuditFireAndForget({
              actionType: "auth_locked",
              targetType: "user",
              targetId: user.id,
              detail: { email: user.email, lockedUntil },
            });
          }
          return null;
        }

        // Successful login — reset counters
        await db
          .update(users)
          .set({ failedLoginCount: 0, lockedUntil: null })
          .where(eq(users.id, user.id));

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
});
