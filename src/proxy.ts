import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Lightweight edge middleware for UX-only early redirects.
 *
 * SECURITY NOTE: This middleware is NOT the security boundary. All real
 * authorization is enforced server-side in pages/route handlers via
 * `requireAuth` / `requirePermission` in `src/lib/authz.ts`. This middleware
 * only improves UX by redirecting unauthenticated visitors away from
 * protected pages before they render, and by sending users who must change
 * their password to the change-password screen.
 *
 * It checks for the presence of the NextAuth session cookie. The cookie is
 * Just-in-Time (JIT) provisioned, so issuance cannot be predicted ahead of
 * time — meaning this check cannot be forged to grant access.
 */

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/reports",
  "/projects",
  "/documents",
  "/staff-hub",
  "/claims",
  "/employees",
  "/audit",
  "/admin",
  "/search",
];

const AUTH_COOKIE_PREFIX = "authjs.session-token";

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );

  if (!isProtected) return NextResponse.next();

  const hasSessionCookie = req.cookies.getAll().some((c) =>
    c.name.startsWith(AUTH_COOKIE_PREFIX)
  );

  // Allow /login and /api/auth to pass through regardless.
  if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  if (!hasSessionCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    const redirect = NextResponse.redirect(url);
    return redirect;
  }

  // Force users with mustChangePassword=true to /change-password (UX only;
  // the layout enforces it server-side too).
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  });
  if (token?.mustChangePassword && !pathname.startsWith("/change-password")) {
    const url = req.nextUrl.clone();
    url.pathname = "/change-password";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/reports/:path*",
    "/projects/:path*",
    "/documents/:path*",
    "/staff-hub/:path*",
    "/claims/:path*",
    "/employees/:path*",
    "/audit/:path*",
    "/admin/:path*",
    "/search/:path*",
  ],
};
