import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";


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
    c.name === AUTH_COOKIE_PREFIX ||
    c.name.endsWith(`.${AUTH_COOKIE_PREFIX}`) ||
    c.name.includes(AUTH_COOKIE_PREFIX)
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
