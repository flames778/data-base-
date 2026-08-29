import { prisma } from "@/lib/prisma";
import type { Session } from "next-auth";
import { getProjectIdsForUser } from "@/lib/dashboard";

/**
 * Authorized search across the platform. Only records the current user is
 * permitted to see are returned — authorization is enforced here, server-side.
 */
export async function searchAll(session: Session, q: string) {
  const userId = session.user.id;
  const perms = session.user.permissions;
  const isManager = perms.includes("reports.view_all") || perms.includes("documents.manage") || session.user.role === "CEO" || session.user.role === "ADMIN";

  const contains = { contains: q, mode: "insensitive" as const };
  const projectIds = await getProjectIdsForUser(userId);

  const results: Record<string, unknown[]> = {};

  // Projects
  results.projects = await prisma.project.findMany({
    where: isManager
      ? { name: contains }
      : { AND: [{ name: contains }, { OR: [{ id: { in: projectIds } }, { leadId: userId }] }] },
    include: { lead: { select: { name: true } } },
    take: 10,
  });

  // Reports (scope to visible)
  results.reports = await prisma.report.findMany({
    where: isManager
      ? { title: contains }
      : {
          AND: [
            { title: contains },
            { OR: [{ authorId: userId }, { projectId: { in: projectIds } }] },
          ],
        },
    include: { author: { select: { name: true } }, template: { select: { name: true } }, project: { select: { name: true } } },
    take: 10,
  });

  // Documents (non-vital only for non-managers; project-scoped for members)
  results.documents = await prisma.document.findMany({
    where: isManager
      ? { isDeleted: false, title: contains }
      : {
          isDeleted: false,
          isVital: false,
          title: contains,
          OR: [{ projectId: null }, { projectId: { in: projectIds } }],
        },
    include: { project: { select: { name: true } } },
    take: 10,
  });

  // Issues (only those the user can see)
  results.issues = await prisma.issue.findMany({
    where: isManager
      ? { title: contains }
      : { AND: [{ title: contains }, { OR: [{ creatorId: userId }, { assigneeId: userId }, { projectId: { in: projectIds } }] }] },
    include: { creator: { select: { name: true } } },
    take: 10,
  });

  // Claims
  results.claims = await prisma.claim.findMany({
    where: isManager
      ? { title: contains }
      : { AND: [{ title: contains }, { applicantId: userId }] },
    include: { applicant: { select: { name: true } } },
    take: 10,
  });

  // Forum posts
  results.posts = await prisma.forumPost.findMany({
    where: { title: contains },
    include: { author: { select: { name: true } } },
    take: 10,
  });

  return results;
}
