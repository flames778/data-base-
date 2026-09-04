"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireAuth, requirePermission, NotFoundError } from "@/lib/authz";
import { errorResult } from "@/lib/actions/util";
import { audit, clientInfo } from "@/lib/audit";
import {
  createUserSchema,
  adminPasswordResetSchema,
  changeOwnPasswordSchema,
  setTeamMembershipSchema,
} from "@/lib/validation";
import {
  hashPassword,
  verifyPassword,
  generateTempPassword,
  validatePasswordStrength,
} from "@/lib/passwords";

/**
 * Create a user and assign an initial role + team memberships (admin only).
 * A password hash is always created. If the caller does not supply a temp
 * password, one is generated and returned once for the admin to share securely.
 */
export async function createUser(input: unknown) {
  const session = await requireAuth();
  await requirePermission("users.manage", session);
  const h = await headers();
  const info = clientInfo(h);

  try {
    const parsed = createUserSchema.parse(input);
    const email = parsed.email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { ok: false as const, error: "A user with that email already exists." };
    }

    const role = await prisma.role.findUnique({ where: { id: parsed.roleId } });
    if (!role) return { ok: false as const, error: "Selected role does not exist." };

    const tempPassword = parsed.tempPassword ?? generateTempPassword();
    const strength = validatePasswordStrength(tempPassword);
    if (!strength.ok) return { ok: false as const, error: strength.error };

    const passwordHash = await hashPassword(tempPassword);

    const user = await prisma.user.create({
      data: {
        email,
        name: parsed.name.trim(),
        roleId: role.id,
        jobTitle: parsed.jobTitle ?? null,
        department: parsed.department ?? null,
        phone: parsed.phone ?? null,
        passwordHash,
        mustChangePassword: true,
        teams: parsed.teamIds?.length
          ? { connect: parsed.teamIds.map((id) => ({ id })) }
          : undefined,
      },
    });

    await audit.user(session.user, {
      action: "user.created",
      resource: "User",
      resourceId: user.id,
      ipAddress: info.ipAddress,
      userAgent: info.userAgent,
      result: "success",
      metadata: { email, role: role.name },
    });

    revalidatePath("/admin/users");
    revalidatePath("/employees");
    return {
      ok: true as const,
      userId: user.id,
      tempPassword: parsed.tempPassword ? undefined : tempPassword,
    };
  } catch (e) {
    return errorResult(e);
  }
}

/**
 * Admin-initiated password reset (admin only). Generates or accepts a new
 * temporary password, forces the user to change it at next login, and revokes
 * any outstanding reset tokens. The resulting password is returned once for
 * secure manual delivery (never stored in plaintext).
 */
export async function adminResetPassword(input: unknown) {
  const session = await requireAuth();
  await requirePermission("users.manage", session);
  const h = await headers();
  const info = clientInfo(h);

  try {
    const parsed = adminPasswordResetSchema.parse(input);

    const target = await prisma.user.findUnique({ where: { id: parsed.userId } });
    if (!target) throw new NotFoundError();
    if (target.email === session.user.email) {
      return { ok: false as const, error: "Manage your own account from the profile settings instead." };
    }

    const tempPassword = parsed.newPassword ?? generateTempPassword();
    const strength = validatePasswordStrength(tempPassword);
    if (!strength.ok) return { ok: false as const, error: strength.error };

    const passwordHash = await hashPassword(tempPassword);
    await prisma.user.update({
      where: { id: target.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
        mustChangePassword: true,
      },
    });

    await audit.user(session.user, {
      action: "user.password_reset",
      resource: "User",
      resourceId: target.id,
      ipAddress: info.ipAddress,
      userAgent: info.userAgent,
      result: "success",
      metadata: { email: target.email },
    });

    revalidatePath("/admin/users");
    return {
      ok: true as const,
      tempPassword: parsed.newPassword ? undefined : tempPassword,
    };
  } catch (e) {
    return errorResult(e);
  }
}

/**
 * A user securely changes their own password. The current password must be
 * verified before the new one is accepted; any outstanding reset tokens are
 * cleared and the forced-change flag is removed.
 */
export async function changeOwnPassword(input: unknown) {
  const session = await requireAuth();
  const h = await headers();
  const info = clientInfo(h);

  try {
    const parsed = changeOwnPasswordSchema.parse(input);

    const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!dbUser) throw new NotFoundError();
    if (!dbUser.passwordHash) {
      return { ok: false as const, error: "No password is set on this account." };
    }

    const valid = await verifyPassword(parsed.currentPassword, dbUser.passwordHash);
    if (!valid) {
      await audit.user(session.user, {
        action: "user.password_change_failed",
        resource: "User",
        resourceId: dbUser.id,
        ipAddress: info.ipAddress,
        userAgent: info.userAgent,
        result: "denied",
      });
      return { ok: false as const, error: "Your current password is incorrect." };
    }

    const strength = validatePasswordStrength(parsed.newPassword);
    if (!strength.ok) return { ok: false as const, error: strength.error };

    const passwordHash = await hashPassword(parsed.newPassword);
    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
        mustChangePassword: false,
      },
    });

    await audit.user(session.user, {
      action: "user.password_changed",
      resource: "User",
      resourceId: dbUser.id,
      ipAddress: info.ipAddress,
      userAgent: info.userAgent,
      result: "success",
    });

    return { ok: true as const };
  } catch (e) {
    return errorResult(e);
  }
}

/**
 * Remove (hard delete) a user — CEO/Admin only.
 * Prevents self-deletion and cleans up team memberships. If the user owns
 * reports/projects, deletion will cascade per schema; use Disable for soft-remove.
 */
export async function deleteUser(input: unknown) {
  const session = await requireAuth();
  await requirePermission("users.manage", session);
  const h = await headers();
  const info = clientInfo(h);

  try {
    const parsed = (input as { userId?: string });
    const userId = typeof parsed?.userId === "string" ? parsed.userId.trim() : "";
    if (!userId) return { ok: false as const, error: "User ID is required." };

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) throw new NotFoundError();
    if (target.email === session.user.email) {
      return { ok: false as const, error: "You cannot remove your own account." };
    }

    // Clean up memberships first, then delete user (reports/documents cascade via FK)
    await prisma.$transaction([
      prisma.userTeamMembership.deleteMany({ where: { userId } }),
      prisma.projectMember.deleteMany({ where: { userId } }),
    ]);

    await prisma.user.delete({ where: { id: userId } });

    await audit.user(session.user, {
      action: "user.deleted",
      resource: "User",
      resourceId: userId,
      ipAddress: info.ipAddress,
      userAgent: info.userAgent,
      result: "success",
      metadata: { email: target.email, name: target.name },
    });

    revalidatePath("/admin/users");
    revalidatePath("/employees");
    return { ok: true as const };
  } catch (e) {
    // Prisma P2003 foreign key constraint → suggest disabling instead
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("Foreign key constraint") || msg.includes("P2003")) {
      return { ok: false as const, error: "Cannot hard-delete: user still owns reports/projects/documents. Disable the account instead." };
    }
    return errorResult(e);
  }
}

/**
 * Set a user's team memberships (replace the full set; admin only).
 * This is a sensitive change and is audited.
 */
export async function setTeamMembership(input: unknown) {
  const session = await requireAuth();
  await requirePermission("teams.manage", session);
  const h = await headers();
  const info = clientInfo(h);

  try {
    const parsed = setTeamMembershipSchema.parse(input);

    const target = await prisma.user.findUnique({ where: { id: parsed.userId } });
    if (!target) throw new NotFoundError();

    const teams = await prisma.team.findMany({
      where: { id: { in: parsed.teamIds } },
      select: { id: true },
    });
    const validIds = new Set(teams.map((t) => t.id));
    const teamIds = parsed.teamIds.filter((id) => validIds.has(id));

    await prisma.$transaction([
      prisma.userTeamMembership.deleteMany({ where: { userId: parsed.userId } }),
      ...(teamIds.length
        ? teamIds.map((teamId) =>
            prisma.userTeamMembership.create({ data: { userId: parsed.userId, teamId } })
          )
        : []),
    ]);

    await audit.user(session.user, {
      action: "user.teams_updated",
      resource: "User",
      resourceId: parsed.userId,
      ipAddress: info.ipAddress,
      userAgent: info.userAgent,
      result: "success",
      metadata: { email: target.email, teamIds },
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin/teams");
    return { ok: true as const };
  } catch (e) {
    return errorResult(e);
  }
}
