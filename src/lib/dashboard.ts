import { prisma } from "@/lib/prisma";
import type { RoleName } from "@prisma/client";
import type { Session } from "next-auth";

/**
 * Dashboard statistics — ALL derived from the live PostgreSQL database.
 * No mock numbers. If the database is empty, counts return 0.
 */

export async function getTeamIdsForUser(userId: string): Promise<string[]> {
  const memberships = await prisma.userTeamMembership.findMany({
    where: { userId },
    select: { teamId: true },
  });
  return memberships.map((m) => m.teamId);
}

export async function getProjectIdsForUser(userId: string): Promise<string[]> {
  const memberships = await prisma.projectMember.findMany({
    where: { userId },
    select: { projectId: true },
  });
  return memberships.map((m) => m.projectId);
}

export interface EmployeeDashboardData {
  myReportCount: number;
  myPendingReports: number; // SUBMITTED/UNDER_REVIEW
  myRevisionRequests: number;
  myProjects: number;
  myActiveIssues: number;
  recentReports: Array<{
    id: string;
    title: string | null;
    status: string;
    templateName: string;
    createdAt: Date;
    projectName: string | null;
  }>;
  recentIssues: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    updatedAt: Date;
  }>;
  myClaims: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: Date;
  }>;
  projects: Array<{ id: string; name: string; status: string }>;
}

export async function getEmployeeDashboard(
  session: Session
): Promise<EmployeeDashboardData> {
  const userId = session.user.id;
  const myProjects = await getProjectIdsForUser(userId);

  const [reports, issues, claims, projects, myReportCount, myPendingReports, myRevisionRequests, myActiveIssues] =
    await Promise.all([
      prisma.report.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          template: { select: { name: true } },
          project: { select: { name: true } },
        },
      }),
      prisma.issue.findMany({
        where: { creatorId: userId },
        orderBy: { updatedAt: "desc" },
        take: 6,
      }),
      prisma.claim.findMany({
        where: { applicantId: userId },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.project.findMany({
        where: { id: { in: myProjects } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.report.count({ where: { authorId: userId } }),
      prisma.report.count({
        where: { authorId: userId, status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
      }),
      prisma.report.count({
        where: { authorId: userId, status: "REVISION_REQUESTED" },
      }),
      prisma.issue.count({
        where: {
          OR: [{ creatorId: userId }, { assigneeId: userId }],
          status: { in: ["OPEN", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS"] },
        },
      }),
    ]);

  return {
    myReportCount,
    myPendingReports,
    myRevisionRequests,
    myProjects: projects.length,
    myActiveIssues,
    recentReports: reports.map((r) => ({
      id: r.id,
      title: r.title ?? "Untitled report",
      status: r.status,
      templateName: r.template.name,
      createdAt: r.createdAt,
      projectName: r.project?.name ?? null,
    })),
    recentIssues: issues.map((i) => ({
      id: i.id,
      title: i.title,
      status: i.status,
      priority: i.priority,
      updatedAt: i.updatedAt,
    })),
    myClaims: claims.map((c) => ({
      id: c.id,
      title: c.title,
      status: c.status,
      createdAt: c.createdAt,
    })),
    projects,
  };
}

export interface LeadDashboardData {
  projectCount: number;
  activeProjects: number;
  reportsForLead: number;
  pendingReviews: number; // SUBMITTED reports in lead's projects
  openIssues: number;
  issueCount: number;
  projects: Array<{
    id: string;
    name: string;
    status: string;
    startDate: Date | null;
    endDate: Date | null;
  }>;
  recentReports: Array<{
    id: string;
    title: string | null;
    status: string;
    authorName: string;
    createdAt: Date;
    projectName: string | null;
  }>;
}

export async function getLeadDashboard(
  session: Session
): Promise<LeadDashboardData> {
  const userId = session.user.id;
  const [projectIds, leadProjects] = await Promise.all([
    getProjectIdsForUser(userId),
    prisma.project.findMany({
      where: { leadId: userId },
      select: { id: true },
    }),
  ]);
  const leadProjectIds = leadProjects.map((p) => p.id);

  // Lead can review reports from projects they lead OR are a member of
  const reviewableIds = [...new Set([...projectIds, ...leadProjectIds])];

  const [projects, reports, reportCount, pendingReviews, issueCount, openIssues] =
    await Promise.all([
      prisma.project.findMany({
        where: { id: { in: reviewableIds } },
        orderBy: { createdAt: "desc" },
        include: { _count: true },
      }),
      prisma.report.findMany({
        where: { projectId: { in: reviewableIds } },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          author: { select: { name: true } },
          project: { select: { name: true } },
        },
      }),
      prisma.report.count({
        where: { projectId: { in: reviewableIds } },
      }),
      prisma.report.count({
        where: {
          projectId: { in: reviewableIds },
          status: "SUBMITTED",
        },
      }),
      prisma.issue.count({
        where: { projectId: { in: reviewableIds } },
      }),
      prisma.issue.count({
        where: {
          projectId: { in: reviewableIds },
          status: { in: ["OPEN", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS"] },
        },
      }),
    ]);

  return {
    projectCount: projects.length,
    activeProjects: projects.filter((p) => p.status === "ACTIVE").length,
    reportsForLead: reportCount,
    pendingReviews,
    openIssues,
    issueCount,
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      startDate: p.startDate,
      endDate: p.endDate,
    })),
    recentReports: reports.map((r) => ({
      id: r.id,
      title: r.title ?? "Untitled report",
      status: r.status,
      authorName: r.author.name,
      createdAt: r.createdAt,
      projectName: r.project?.name ?? null,
    })),
  };
}

export interface CeoDashboardData {
  totalEmployees: number;
  activeProjects: number;
  totalProjects: number;
  reportsThisPeriod: number;
  pendingReports: number;
  overdueReports: number;
  openIssues: number;
  criticalIssues: number;
  totalIssues: number;
  totalDocuments: number;
  vitalDocuments: number;
  recentActivity: Array<{
    id: string;
    action: string;
    userName: string | null;
    createdAt: Date;
  }>;
  projectsByStatus: Record<string, number>;
}

export async function getCeoDashboard(): Promise<CeoDashboardData> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalEmployees,
    activeProjects,
    totalProjects,
    reportsThisPeriod,
    pendingReports,
    overdueReports,
    openIssues,
    criticalIssues,
    totalIssues,
    totalDocuments,
    vitalDocuments,
    recentActivity,
    projectsByStatusRaw,
  ] = await Promise.all([
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.project.count({ where: { status: "ACTIVE" } }),
    prisma.project.count(),
    prisma.report.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.report.count({
      where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
    }),
    prisma.report.count({
      where: {
        deadline: { lt: new Date() },
        status: { in: ["DRAFT", "REVISION_REQUESTED", "SUBMITTED", "UNDER_REVIEW"] },
      },
    }),
    prisma.issue.count({
      where: { status: { in: ["OPEN", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS"] } },
    }),
    prisma.issue.count({ where: { priority: "CRITICAL", status: { not: "CLOSED" } } }),
    prisma.issue.count(),
    prisma.document.count({ where: { isDeleted: false } }),
    prisma.document.count({ where: { isVital: true, isDeleted: false } }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { name: true } } },
    }),
    prisma.project.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const projectsByStatus: Record<string, number> = {};
  for (const g of projectsByStatusRaw) projectsByStatus[g.status] = g._count._all;

  return {
    totalEmployees,
    activeProjects,
    totalProjects,
    reportsThisPeriod,
    pendingReports,
    overdueReports,
    openIssues,
    criticalIssues,
    totalIssues,
    totalDocuments,
    vitalDocuments,
    recentActivity: recentActivity.map((a) => ({
      id: a.id,
      action: a.action,
      userName: a.user?.name ?? null,
      createdAt: a.createdAt,
    })),
    projectsByStatus,
  };
}

export async function getAdminDashboard() {
  const [totalUsers, activeUsers, teams, projects, reports, issues, claims, documents] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.team.count(),
      prisma.project.count(),
      prisma.report.count(),
      prisma.issue.count(),
      prisma.claim.count(),
      prisma.document.count({ where: { isDeleted: false } }),
    ]);

  const usersByRole = await prisma.user.groupBy({
    by: ["roleId"],
    _count: { _all: true },
  });
  const roles = await prisma.role.findMany({ select: { id: true, name: true } });
  const roleMap = new Map(roles.map((r) => [r.id, r.name]));
  const usersByRoleNamed = usersByRole.map((u) => ({
    role: roleMap.get(u.roleId) ?? u.roleId,
    count: u._count._all,
  }));

  return {
    totalUsers,
    activeUsers,
    teams,
    projects,
    reports,
    issues,
    claims,
    documents,
    usersByRole: usersByRoleNamed,
  };
}

export async function roleLabel(role: RoleName): Promise<string> {
  const r = await prisma.role.findUnique({ where: { name: role } });
  return r?.displayName ?? role;
}
