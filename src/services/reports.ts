import { prisma } from "@/lib/prisma";
import type { ReportStatus } from "@prisma/client";
import type { Session as AuthSession } from "next-auth";
import { ForbiddenError, NotFoundError } from "@/lib/authz";
import { getProjectIdsForUser } from "@/lib/dashboard";

/**
 * Authorization rules for report access.
 */
export async function canViewReport(
  userId: string,
  report: { authorId: string; projectId: string | null },
  permissions: string[]
): Promise<boolean> {
  // Own reports always viewable
  if (report.authorId === userId) return true;
  // Anyone with view_all can view any report
  if (permissions.includes("reports.view_all")) return true;
  // Reviewers (leads) can view reports in projects they are part of
  if (permissions.includes("reports.review") || permissions.includes("reports.approve")) {
    if (report.projectId) {
      const projectIds = await getProjectIdsForUser(userId);
      if (projectIds.includes(report.projectId)) return true;
    }
  }
  return false;
}

/**
 * List reports visible to a user with full server-side authorization.
 */
export async function listVisibleReports(session: AuthSession, opts: {
  status?: ReportStatus;
  projectId?: string;
} = {}) {
  const userId = session.user.id;
  const perms = session.user.permissions;

  let where = {};

  if (perms.includes("reports.view_all")) {
    where = { ...where, ...(opts.status ? { status: opts.status } : {}) };
    if (opts.projectId) where = { ...where, projectId: opts.projectId };
  } else {
    // Own reports
    const own: Record<string, unknown> = { authorId: userId };
    const clauses: Array<Record<string, unknown>> = [own];

    // Reports in projects the user can review
    if (perms.includes("reports.review") || perms.includes("reports.approve")) {
      const projectIds = await getProjectIdsForUser(userId);
      if (projectIds.length > 0) {
        clauses.push({ projectId: { in: projectIds } });
      }
    }

    where = { ...(where as object), OR: clauses };
    if (opts.status) where = { ...where, status: opts.status };
    if (opts.projectId) where = { ...where, projectId: opts.projectId };
  }

  const reports = await prisma.report.findMany({
    where: where as never,
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { name: true } },
      template: { select: { name: true } },
      project: { select: { name: true } },
      _count: { select: { comments: true } },
    },
  });

  return reports;
}

/**
 * Get a single report with authorization.
 */
export async function getAuthorizedReport(session: AuthSession, reportId: string) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      author: { select: { name: true, email: true } },
      template: { include: { fields: { orderBy: { sortOrder: "asc" } } } },
      project: true,
      fieldValues: true,
      statusHistory: {
        orderBy: { createdAt: "desc" },
        include: { changedBy: { select: { name: true } } },
      },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true } } },
      },
      completedBy: { select: { name: true } },
      recognitions: { include: { givenBy: { select: { name: true } } } },
    },
  });
  if (!report) throw new NotFoundError();
  const allowed = await canViewReport(
    session.user.id,
    report,
    session.user.permissions
  );
  if (!allowed) throw new ForbiddenError();
  return report;
}

/**
 * Allowed status transitions.
 */
export const ALLOWED_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  DRAFT: ["SUBMITTED", "ARCHIVED"],
  SUBMITTED: ["UNDER_REVIEW", "APPROVED", "REJECTED", "REVISION_REQUESTED", "ARCHIVED"],
  UNDER_REVIEW: ["APPROVED", "REJECTED", "REVISION_REQUESTED", "ACTION_REQUIRED", "RESOLVED", "COMPLETED", "SUCCESS", "ARCHIVED"],
  REVISION_REQUESTED: ["SUBMITTED", "ARCHIVED"],
  APPROVED: ["ARCHIVED"],
  REJECTED: ["ARCHIVED"],
  ACTION_REQUIRED: ["SUBMITTED", "RESOLVED", "COMPLETED", "SUCCESS", "ARCHIVED"],
  RESOLVED: ["COMPLETED", "SUCCESS", "ARCHIVED"],
  COMPLETED: ["SUCCESS", "ARCHIVED"],
  SUCCESS: ["ARCHIVED"],
  ARCHIVED: [],
};

export function canTransition(from: ReportStatus, to: ReportStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}
