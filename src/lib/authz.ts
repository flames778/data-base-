import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { PermissionKey } from "@/lib/permissions";
import type { Session } from "next-auth";

/**
 * Server-side authorization helpers.
 *
 * These are the ONLY way authorization decisions are made. The frontend never
 * decides security — it only reflects these server-side determinations.
 */

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

export class ForbiddenError extends AuthError {
  constructor(message = "You do not have permission to access this resource.") {
    super(message, 403);
  }
}

export class NotFoundError extends AuthError {
  constructor(message = "Resource not found.") {
    super(message, 404);
  }
}

export class UnauthorizedError extends AuthError {
  constructor(message = "Authentication required.") {
    super(message, 401);
  }
}

/**
 * Return the current auth session (JWT-based). Null if not authenticated.
 */
export async function getSession(): Promise<Session | null> {
  return auth();
}

/**
 * Return the authenticated session or throw 401.
 */
export async function requireAuth(): Promise<Session> {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError();
  return session;
}

/**
 * Check if the current user has a given permission (from the session token).
 */
export async function hasPermission(
  session: Session | null,
  permission: PermissionKey
): Promise<boolean> {
  if (!session?.user?.permissions) return false;
  return session.user.permissions.includes(permission);
}

/**
 * Require that the current user has the given permission, else throw 403.
 */
export async function requirePermission(
  permission: PermissionKey,
  session?: Session | null
): Promise<Session> {
  const s = session ?? (await requireAuth());
  if (!s.user.permissions?.includes(permission)) throw new ForbiddenError();
  return s;
}

/**
 * Fetch the full current user (with role) from the database.
 */
export async function getCurrentUser(session?: Session | null) {
  const s = session ?? (await auth());
  if (!s?.user?.id) return null;
  return prisma.user.findUnique({
    where: { id: s.user.id },
    include: { role: true },
  });
}

/**
 * Fetch the current user, throwing 401 if not authenticated.
 */
export async function requireCurrentUser(session?: Session | null) {
  const s = session ?? (await requireAuth());
  const user = await prisma.user.findUnique({
    where: { id: s.user.id },
    include: { role: true },
  });
  if (!user || user.status === "DISABLED") throw new UnauthorizedError();
  return user;
}
