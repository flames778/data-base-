import { prisma } from "@/lib/prisma";
import type { Session } from "next-auth";
import { ForbiddenError, NotFoundError } from "@/lib/authz";
import { getProjectIdsForUser } from "@/lib/dashboard";

export async function listVisibleIssues(session: Session) {
  const userId = session.user.id;
  const perms = session.user.permissions;

  const canManage = perms.includes("issues.manage");
  let where = {};

  if (canManage) {
    // managers (lead/admin/ceo) see issues in their projects or all for ceo/admin
    if (session.user.role === "CEO" || session.user.role === "ADMIN") {
      where = {};
    } else {
      const projectIds = await getProjectIdsForUser(userId);
      const leadProjects = (
        await prisma.project.findMany({ where: { leadId: userId }, select: { id: true } })
      ).map((p) => p.id);
      const ids = [...new Set([...projectIds, ...leadProjects])];
      where = { OR: [{ creatorId: userId }, { assigneeId: userId }, { projectId: { in: ids } }] };
    }
  } else {
    // regular members see issues they created or are assigned
    where = { OR: [{ creatorId: userId }, { assigneeId: userId }] };
  }

  return prisma.issue.findMany({
    where: where as never,
    orderBy: { updatedAt: "desc" },
    include: {
      creator: { select: { name: true } },
      assignee: { select: { name: true } },
      project: { select: { name: true } },
    },
  });
}

export async function getAuthorizedIssue(session: Session, issueId: string) {
  const userId = session.user.id;
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: {
      creator: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true } } },
      },
      statusHistory: {
        orderBy: { createdAt: "desc" },
        include: { changedBy: { select: { name: true } } },
      },
    },
  });
  if (!issue) throw new NotFoundError();

  const canManage =
    issue.creatorId === userId ||
    issue.assigneeId === userId ||
    session.user.permissions.includes("issues.manage");

  if (!canManage) throw new ForbiddenError();
  return issue;
}
