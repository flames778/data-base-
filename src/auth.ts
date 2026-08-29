import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/passwords";
import type { RoleName } from "@prisma/client";
import type { PermissionKey } from "@/lib/permissions";

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
      async authorize(credentials) {
        const rawEmail = credentials?.email;
        const rawPassword = credentials?.password;
        if (typeof rawEmail !== "string" || typeof rawPassword !== "string") {
          return null;
        }

        const email = rawEmail.trim().toLowerCase();
        if (!email || !rawPassword) return null;

        const dbUser = await prisma.user.findUnique({ where: { email } });
        if (!dbUser || !dbUser.passwordHash) return null;
        if (dbUser.status !== "ACTIVE") return null;

        const valid = await verifyPassword(rawPassword, dbUser.passwordHash);
        if (!valid) return null;

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
      if (user?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            role: { include: { permissions: { include: { permission: true } } } },
          },
        });

        if (!dbUser) {
          // Account deleted between authorize() and now: void the identity.
          token.sub = "";
          token.role = "TEAM_MEMBER";
          token.permissions = [];
          return token;
        }

        if (dbUser.status === "DISABLED") {
          // Disabled mid-session: void the identity so requireAuth rejects.
          token.sub = "";
          token.role = "TEAM_MEMBER";
          token.permissions = [];
          return token;
        }

        token.sub = dbUser.id;
        token.role = dbUser.role.name as RoleName;
        token.permissions = dbUser.role.permissions.map(
          (rp) => rp.permission.key as PermissionKey
        );
        token.mustChangePassword = dbUser.mustChangePassword;

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
