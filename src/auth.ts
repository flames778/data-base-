import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/passwords";
import {
  assertNotRateLimited,
  clearAttempts,
  extractIp,
  recordFailedAttempt,
} from "@/lib/login-rate-limit";
import type { RoleName } from "@prisma/client";
import type { PermissionKey } from "@/lib/permissions";

// How long a JWT's cached role/permissions are trusted before we hit the DB
// again. Lower = revocation/role-changes take effect faster, at the cost of
// a DB query on more requests. Raise if the extra query load matters more
// than fast revocation for your deployment.
const REFRESH_INTERVAL_MS = 60_000; // 1 minute

/**
 * Auth.js (NextAuth v5) configuration for first-party credentials auth.
 *
 * Users sign in with email + password. Passwords are verified against the
 * bcrypt hash stored in PostgreSQL (never stored in plaintext). The
 * authenticated identity is always derived from the server-side JWT session,
 * never from the frontend. Role and permissions are loaded fresh from the
 * database on every new session.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
  },
  trustHost: true,
  providers: [
    Credentials({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const rawEmail = credentials?.email;
        const rawPassword = credentials?.password;
        if (typeof rawEmail !== "string" || typeof rawPassword !== "string") {
          return null;
        }

        const email = rawEmail.trim().toLowerCase();
        if (!email || !rawPassword) return null;

        const ipAddress = extractIp(request.headers);

        // Check the limit before doing any DB/bcrypt work for this attempt.
        // Throwing here surfaces as a CredentialsSignin error to the client
        // without leaking whether the email exists.
        await assertNotRateLimited(email, ipAddress);

        const dbUser = await prisma.user.findUnique({ where: { email } });
        if (!dbUser || !dbUser.passwordHash || dbUser.status !== "ACTIVE") {
          await recordFailedAttempt(email, ipAddress);
          return null;
        }

        const valid = await verifyPassword(rawPassword, dbUser.passwordHash);
        if (!valid) {
          await recordFailedAttempt(email, ipAddress);
          return null;
        }

        await clearAttempts(email);

        return {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Re-resolve role/permissions/status from the database periodically,
      // not just at initial sign-in. `user` is only defined on the sign-in
      // request; on every subsequent request NextAuth calls this callback
      // with only `token`. If we only refreshed when `user` was present, a
      // disabled account, a role change, or a permission change would not
      // take effect until the JWT naturally expired (default 30 days) or the
      // user manually re-authenticated — silently ignoring the "disabled
      // mid-session" case this code was written to handle.
      //
      // To avoid a DB round-trip on every single request, we only refetch on
      // sign-in or once the cached copy is older than REFRESH_INTERVAL_MS.
      // Worst case, a disable/role change takes up to that long to take
      // effect — an acceptable trade-off. Set to 0 to always refetch.
      const userId = user?.id ?? token.sub;
      if (!userId) return token;

      const isSignIn = Boolean(user?.id);
      const lastChecked = typeof token.permissionsCheckedAt === "number" ? token.permissionsCheckedAt : 0;
      const isStale = Date.now() - lastChecked > REFRESH_INTERVAL_MS;
      if (!isSignIn && !isStale) {
        return token;
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: { include: { permissions: { include: { permission: true } } } },
        },
      });

      if (!dbUser || dbUser.status === "DISABLED") {
        // Account deleted, or disabled mid-session: void the identity so
        // requireAuth/requirePermission reject on the next stale-check cycle.
        token.sub = "";
        token.role = "TEAM_MEMBER";
        token.permissions = [];
        token.permissionsCheckedAt = Date.now();
        return token;
      }

      token.sub = dbUser.id;
      token.role = dbUser.role.name as RoleName;
      token.permissions = dbUser.role.permissions.map(
        (rp) => rp.permission.key as PermissionKey
      );
      token.mustChangePassword = dbUser.mustChangePassword;
      token.permissionsCheckedAt = Date.now();

      if (isSignIn) {
        // Only bump lastLogin on the actual sign-in request, not on every
        // subsequent token refresh.
        if (!dbUser.lastLogin || dbUser.lastLogin < new Date(Date.now() - 60_000)) {
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { lastLogin: new Date() },
          });
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role ?? "TEAM_MEMBER") as RoleName;
        session.user.permissions = (token.permissions ?? []) as PermissionKey[];
        session.user.mustChangePassword = (token.mustChangePassword ?? false) as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
