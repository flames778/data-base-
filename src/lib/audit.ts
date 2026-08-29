import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

/**
 * Audit logging — append-only record of important system activity.
 *
 * Audit logs are never editable or deletable by ordinary users. Only users
 * with the `audit.view` permission can read them.
 *
 * Usage:
 *   await audit.record({ user, action, resource, resourceId, ipAddress, userAgent, result, metadata })
 */
interface AuditInput {
  user?: Pick<User, "id"> | null;
  action: string;
  resource?: string;
  resourceId?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  result?: string;
  metadata?: Record<string, unknown>;
}

export const audit = {
  /**
   * Record an audit event with an explicit user object.
   */
  async record(input: AuditInput): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: input.user?.id ?? null,
          action: input.action,
          resource: input.resource ?? null,
          resourceId: input.resourceId ?? null,
          ipAddress: input.ipAddress ?? null,
          userAgent: input.userAgent ?? null,
          result: input.result ?? null,
          metadata: (input.metadata as never) ?? undefined,
        },
      });
    } catch (e) {
      // Never let audit logging failure break the primary operation; log server-side.
      console.error("Audit log write failed:", e);
    }
  },

  /**
   * Convenience: record an action for the currently authenticated user,
   * deriving IP/user-agent from the incoming request headers when available.
   */
  async user(user: Pick<User, "id"> | null | undefined, input: Omit<AuditInput, "user">): Promise<void> {
    return audit.record({ ...input, user: user ?? undefined });
  },

  // Alias for parity with auth.ts usage
  prisma: async (
    user: Pick<User, "id"> | null | undefined,
    input: Omit<AuditInput, "user">
  ): Promise<void> => {
    return audit.record({ ...input, user: user ?? undefined });
  },
};

/**
 * Extract IP address and user agent from a Next.js Request/Headers object.
 */
export function clientInfo(headers: Headers): {
  ipAddress: string | null;
  userAgent: string | null;
} {
  const fwd = headers.get("x-forwarded-for");
  const ip = fwd ? fwd.split(",")[0].trim() : (headers.get("x-real-ip") ?? null);
  return {
    ipAddress: ip,
    userAgent: headers.get("user-agent"),
  };
}
