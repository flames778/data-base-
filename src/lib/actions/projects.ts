"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth, requirePermission } from "@/lib/authz";
import { errorResult } from "@/lib/actions/util";
import { projectSchema } from "@/lib/validation";
import { audit, clientInfo } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { headers } from "next/headers";

/**
 * Create a project (admin or any user with projects.manage).
 */
export async function createProject(input: {
  name: string;
  description?: string;
  client?: string;
  leadId?: string | null;
  teamId?: string | null;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
}) {
  const session = await requireAuth();
  await requirePermission("projects.manage", session);
  const h = await headers();
  const info = clientInfo(h);

  try {
    const parsed = projectSchema.parse({
      ...input,
      startDate: input.startDate || null,
      endDate: input.endDate || null,
    });

    const res = await prisma.project.findFirst({
      where: { name: parsed.name },
      select: { id: true },
    });
    if (res) return { error: "A project with that name already exists." };

    const project = await prisma.project.create({
      data: {
        name: parsed.name,
        description: parsed.description ?? null,
        client: parsed.client ?? null,
        leadId: parsed.leadId ?? null,
        teamId: parsed.teamId ?? null,
        status: parsed.status as never,
        startDate: parsed.startDate ? new Date(parsed.startDate) : null,
        endDate: parsed.endDate ? new Date(parsed.endDate) : null,
        members: parsed.leadId
          ? { create: { userId: parsed.leadId } }
          : undefined,
      },
    });

    await audit.user(session.user, {
      action: "project.created",
      resource: "Project",
      resourceId: project.id,
      ipAddress: info.ipAddress,
      userAgent: info.userAgent,
      result: "success",
    });

    if (parsed.leadId && parsed.leadId !== session.user.id) {
      await notify({
        userId: parsed.leadId,
        type: "PROJECT_ASSIGNMENT",
        title: "Project assignment",
        message: `You have been assigned as lead to project "${project.name}".`,
        link: `/projects/${project.id}`,
      });
    }

    revalidatePath("/projects");
    return { ok: true as const, projectId: project.id };
  } catch (e) {
    return errorResult(e);
  }
}

/**
 * Add a member to a project.
 */
export async function addProjectMember(input: {
  projectId: string;
  userId: string;
}) {
  const session = await requireAuth();
  await requirePermission("projects.manage", session);

  try {
    const existing = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: input.projectId,
          userId: input.userId,
        },
      },
    });
    if (existing) return { error: "User is already a member." };

    await prisma.projectMember.create({
      data: { projectId: input.projectId, userId: input.userId },
    });

    await notify({
      userId: input.userId,
      type: "PROJECT_ASSIGNMENT",
      title: "Project assignment",
      message: "You have been added to a project.",
      link: `/projects/${input.projectId}`,
    });

    revalidatePath(`/projects/${input.projectId}`);
    return { ok: true as const };
  } catch (e) {
    return errorResult(e);
  }
}

/**
 * Update a project's status.
 */
export async function updateProjectStatus(input: {
  projectId: string;
  status: string;
}) {
  const session = await requireAuth();
  await requirePermission("projects.manage", session);

  try {
    await prisma.project.update({
      where: { id: input.projectId },
      data: { status: input.status as never },
    });
    revalidatePath(`/projects/${input.projectId}`);
    revalidatePath("/projects");
    return { ok: true as const };
  } catch (e) {
    return errorResult(e);
  }
}
