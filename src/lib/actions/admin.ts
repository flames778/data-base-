"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  requireAuth,
  requirePermission,
  NotFoundError,
} from "@/lib/authz";
import { errorResult } from "@/lib/actions/util";
import { userUpdateSchema } from "@/lib/validation";
import { audit, clientInfo } from "@/lib/audit";
import { headers } from "next/headers";
import type { UserStatus, ReportFieldType } from "@prisma/client";

/**
 * Update a user's role/department/jobTitle/phone/status (admin only).
 */
export async function updateUser(input: {
  userId: string;
  roleId?: string;
  department?: string | null;
  jobTitle?: string | null;
  phone?: string | null;
  status?: "ACTIVE" | "DISABLED";
}) {
  const session = await requireAuth();
  await requirePermission("users.manage", session);
  const h = await headers();
  const info = clientInfo(h);

  try {
    const parsed = userUpdateSchema.parse(input);
    const target = await prisma.user.findUnique({ where: { id: input.userId } });
    if (!target) throw new NotFoundError();

    // Guard: an admin cannot disable/demote themselves via this path
    if (target.email === session.user.email) {
      return { error: "You cannot modify your own account here." };
    }

    const updated = await prisma.user.update({
      where: { id: input.userId },
      data: {
        roleId: parsed.roleId ?? target.roleId,
        department: parsed.department ?? target.department,
        jobTitle: parsed.jobTitle ?? target.jobTitle,
        phone: parsed.phone ?? target.phone,
        status: parsed.status ? (parsed.status as UserStatus) : target.status,
      },
    });

    await audit.user(session.user, {
      action: parsed.status === "DISABLED" ? "user.disabled" : "user.updated",
      resource: "User",
      resourceId: updated.id,
      ipAddress: info.ipAddress,
      userAgent: info.userAgent,
      result: "success",
      metadata: { changes: input },
    });

    revalidatePath("/employees");
    revalidatePath("/admin/users");
    return { ok: true as const };
  } catch (e) {
    return errorResult(e);
  }
}

/**
 * Create a team (admin only).
 */
export async function createTeam(input: { name: string; description?: string; managerId?: string | null }) {
  const session = await requireAuth();
  await requirePermission("teams.manage", session);
  try {
    const name = input.name.trim();
    if (!name) return { error: "Team name is required." };
    const existing = await prisma.team.findUnique({ where: { name } });
    if (existing) return { error: "A team with that name already exists." };
    const team = await prisma.team.create({
      data: { name, description: input.description ?? null, managerId: input.managerId ?? null },
    });
    await audit.user(session.user, {
      action: "team.created",
      resource: "Team",
      resourceId: team.id,
      result: "success",
    });
    revalidatePath("/admin/teams");
    return { ok: true as const };
  } catch (e) {
    return errorResult(e);
  }
}

/**
 * Create a report template (admin/CEO).
 */
export async function createReportTemplate(input: {
  name: string;
  code: string;
  description?: string;
  category: string;
  fields: Array<{ key: string; label: string; type: string; required: boolean; placeholder?: string; sortOrder: number }>;
}) {
  const session = await requireAuth();
  await requirePermission("reports.manage_templates", session);
  try {
    const existing = await prisma.reportTemplate.findUnique({ where: { code: input.code } });
    if (existing) return { error: "A template with that code already exists." };
    if (!input.name || !input.code) return { error: "Name and code are required." };

    const template = await prisma.reportTemplate.create({
      data: {
        name: input.name,
        code: input.code,
        description: input.description ?? null,
        category: input.category || "OTHER",
        fields: {
          create: input.fields.map((f) => ({
            key: f.key,
            label: f.label,
            type: f.type as ReportFieldType,
            required: f.required,
            placeholder: f.placeholder ?? undefined,
            sortOrder: f.sortOrder,
          })),
        },
      },
    });
    await audit.user(session.user, {
      action: "report_template.created",
      resource: "ReportTemplate",
      resourceId: template.id,
      result: "success",
    });
    revalidatePath("/reports");
    revalidatePath("/admin/templates");
    return { ok: true as const, templateId: template.id };
  } catch (e) {
    return errorResult(e);
  }
}
