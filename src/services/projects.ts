import { prisma } from "@/lib/prisma";
import type { Session } from "next-auth";
import { getProjectIdsForUser } from "@/lib/dashboard";
import { ForbiddenError, NotFoundError } from "@/lib/authz";

/**
 * List projects visible to a user with authorization.
 */
export async function listVisibleProjects(session: Session) {
  const userId = session.user.id;
  const perms = session.user.permissions;

  if (perms.includes("projects.view") && (session.user.role === "CEO" || session.user.role === "ADMIN")) {
    // CEOs/admins see all
    return prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        lead: { select: { name: true } },
        team: { select: { name: true } },
        _count: { select: { members: true, reports: true, issues: true } },
      },
    });
  }

  // Leads and members see projects they are in
  const projectIds = await getProjectIdsForUser(userId);
  const leadProjects = await prisma.project.findMany({
    where: { leadId: userId },
    select: { id: true },
  });
  const ids = new Set([...projectIds, ...leadProjects.map((p) => p.id)]);

  return prisma.project.findMany({
    where: { id: { in: [...ids] } },
    orderBy: { createdAt: "desc" },
    include: {
      lead: { select: { name: true } },
      team: { select: { name: true } },
      _count: { select: { members: true, reports: true, issues: true } },
    },
  });
}

/**
 * Get a single project with authorization.
 */
export async function getAuthorizedProject(session: Session, projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      lead: { select: { id: true, name: true, email: true } },
      team: { select: { id: true, name: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true, role: { select: { name: true } }, department: true } } },
      },
      reports: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true } }, template: { select: { name: true } } },
      },
      issues: {
        orderBy: { updatedAt: "desc" },
        include: { creator: { select: { name: true } }, assignee: { select: { name: true } } },
      },
    },
  });
  if (!project) throw new NotFoundError();

  const perms = session.user.permissions;
  const isOwner = session.user.id === project.leadId;
  const isMember = project.members.some((m) => m.user.id === session.user.id);

  const allowed =
    perms.includes("projects.view") && (session.user.role === "CEO" || session.user.role === "ADMIN")
      ? true
      : isOwner || isMember;
  if (!allowed) throw new ForbiddenError();

  return project;
}
