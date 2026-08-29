import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";

/**
 * Create a notification for a user. Stored in PostgreSQL.
 */
export async function notify(input: {
  userId: string;
  type: NotificationType;
  title: string;
  message?: string;
  link?: string;
}): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message ?? null,
        link: input.link ?? null,
      },
    });
  } catch (e) {
    console.error("Notification creation failed:", e);
  }
}

/**
 * Find the project lead(s) for a project (the lead + any members with the
 * PROJECT_LEAD role).
 */
export async function projectReviewers(
  projectId: string
): Promise<string[]> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { lead: true, members: { include: { user: { include: { role: true } } } } },
  });
  if (!project) return [];

  const ids = new Set<string>();
  if (project.leadId) ids.add(project.leadId);
  for (const m of project.members) {
    if (m.user.role.name === "PROJECT_LEAD" || m.user.role.name === "ADMIN" || m.user.role.name === "CEO") {
      ids.add(m.user.id);
    }
  }
  return [...ids];
}

/**
 * Managers who can review claims (admins, CEO, project leads).
 */
export async function claimReviewerIds(): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: {
      role: { name: { in: ["CEO", "ADMIN", "PROJECT_LEAD"] } },
      status: "ACTIVE",
    },
    select: { id: true },
  });
  return users.map((u) => u.id);
}

export async function adminAndCeoIds(): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: { role: { name: { in: ["CEO", "ADMIN"] } }, status: "ACTIVE" },
    select: { id: true },
  });
  return users.map((u) => u.id);
}
