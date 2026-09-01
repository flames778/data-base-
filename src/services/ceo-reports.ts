import { prisma } from "@/lib/prisma";
import type { ReportStatus } from "@prisma/client";
import type { Session as AuthSession } from "next-auth";
import { ForbiddenError, NotFoundError } from "@/lib/authz";
import { audit } from "@/lib/audit";

/**
 * Mark a report as completed by the CEO.
 * Updates the report status to COMPLETED or SUCCESS and records who completed it.
 */
export async function completeReport(
  session: AuthSession,
  reportId: string,
  toStatus: ReportStatus,
  note?: string
) {
  // Verify authorization
  if (!session.user.permissions.includes("reports.complete")) {
    throw new ForbiddenError("Permission denied: reports.complete");
  }

  // Only allow COMPLETED or SUCCESS as final statuses
  if (!["COMPLETED", "SUCCESS"].includes(toStatus)) {
    throw new Error("Invalid completion status. Use COMPLETED or SUCCESS.");
  }

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { author: { select: { name: true, email: true } } },
  });

  if (!report) throw new NotFoundError();

  // Update the report
  const updated = await prisma.report.update({
    where: { id: reportId },
    data: {
      status: toStatus,
      completedAt: new Date(),
      completedById: session.user.id,
    },
  });

  // Create status history entry
  await prisma.reportStatusHistory.create({
    data: {
      reportId,
      fromStatus: report.status,
      toStatus,
      changedById: session.user.id,
      note: note || `Marked as ${toStatus.replace(/_/g, " ")} by ${session.user.name}`,
    },
  });

  // Create audit log
  await audit.user(session.user, {
    action: "REPORT_COMPLETED",
    resource: "Report",
    resourceId: reportId,
    result: "success",
    metadata: {
      reportTitle: report.title,
      authorName: report.author.name,
      newStatus: toStatus,
      note,
    },
  });

  // Create notification for report author
  await prisma.notification.create({
    data: {
      userId: report.authorId,
      type: "REPORT_APPROVED", // Reuse existing notification type
      title: "Report Completed",
      message: `Your report "${report.title}" has been marked as ${toStatus.replace(/_/g, " ")} by ${session.user.name}.`,
      link: `/reports/${reportId}`,
    },
  });

  return updated;
}

/**
 * Give recognition/reward to a staff member.
 */
export async function giveRecognition(
  session: AuthSession,
  data: {
    recipientId: string;
    reportId?: string;
    rewardType: string;
    message?: string;
  }
) {
  // Verify authorization
  if (!session.user.permissions.includes("staff.recognize")) {
    throw new ForbiddenError("Permission denied: staff.recognize");
  }

  const recipient = await prisma.user.findUnique({
    where: { id: data.recipientId },
    select: { id: true, name: true, email: true },
  });

  if (!recipient) throw new NotFoundError("Recipient user not found");

  // Prevent self-recognition
  if (data.recipientId === session.user.id) {
    throw new Error("You cannot give recognition to yourself");
  }

  const recognition = await prisma.recognitionReward.create({
    data: {
      recipientId: data.recipientId,
      reportId: data.reportId,
      rewardType: data.rewardType,
      message: data.message,
      givenById: session.user.id,
    },
    include: {
      recipient: { select: { name: true } },
      givenBy: { select: { name: true } },
      report: { select: { id: true, title: true } },
    },
  });

  // Create audit log
  await audit.user(session.user, {
    action: "RECOGNITION_GIVEN",
    resource: "RecognitionReward",
    resourceId: recognition.id,
    result: "success",
    metadata: {
      recipientName: recipient.name,
      rewardType: data.rewardType,
      reportId: data.reportId,
      message: data.message,
    },
  });

  // Create notification for recipient
  await prisma.notification.create({
    data: {
      userId: data.recipientId,
      type: "ANNOUNCEMENT", // Reuse announcement type
      title: "You Received Recognition",
      message: `${session.user.name} recognized you with "${data.rewardType}". ${data.message ? `Message: ${data.message}` : ""}`,
      link: `/dashboard`,
    },
  });

  return recognition;
}

/**
 * Get CEO-specific report statistics.
 */
export async function getCEOReportStats() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    awaitingReview,
    underReview,
    actionRequired,
    resolved,
    completed,
    successful,
  ] = await Promise.all([
    prisma.report.count({ where: { status: "SUBMITTED" } }),
    prisma.report.count({ where: { status: "UNDER_REVIEW" } }),
    prisma.report.count({ where: { status: "ACTION_REQUIRED" } }),
    prisma.report.count({ where: { status: "RESOLVED" } }),
    prisma.report.count({ where: { status: "COMPLETED" } }),
    prisma.report.count({ where: { status: "SUCCESS" } }),
  ]);

  return {
    awaitingReview,
    underReview,
    actionRequired,
    resolved,
    completed,
    successful,
    total: awaitingReview + underReview + actionRequired + resolved + completed + successful,
  };
}

/**
 * Get recent recognitions given by the CEO.
 */
export async function getRecentRecognitions(limit = 10) {
  return prisma.recognitionReward.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      recipient: { select: { name: true } },
      givenBy: { select: { name: true } },
      report: { select: { id: true, title: true } },
    },
  });
}

/**
 * Get recognitions received by a user.
 */
export async function getUserRecognitions(userId: string) {
  return prisma.recognitionReward.findMany({
    where: { recipientId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      givenBy: { select: { name: true } },
      report: { select: { id: true, title: true } },
    },
  });
}

/**
 * List all reports for CEO with advanced filtering.
 */
export async function listReportsForCEO(filters: {
  status?: ReportStatus;
  department?: string;
  reportType?: string;
  submittedAfter?: Date;
  submittedBefore?: Date;
  authorId?: string;
  limit?: number;
  offset?: number;
}) {
  const where: Record<string, any> = {};

  if (filters.status) where.status = filters.status;
  if (filters.authorId) where.authorId = filters.authorId;
  if (filters.department) {
    where.author = { department: filters.department };
  }
  if (filters.reportType) {
    where.template = { code: filters.reportType };
  }
  if (filters.submittedAfter || filters.submittedBefore) {
    where.submittedAt = {};
    if (filters.submittedAfter) where.submittedAt.gte = filters.submittedAfter;
    if (filters.submittedBefore) where.submittedAt.lte = filters.submittedBefore;
  }

  const reports = await prisma.report.findMany({
    where,
    orderBy: { submittedAt: "desc" },
    take: filters.limit || 20,
    skip: filters.offset || 0,
    include: {
      author: { select: { id: true, name: true, department: true } },
      template: { select: { name: true, code: true } },
      project: { select: { name: true } },
      completedBy: { select: { name: true } },
      _count: { select: { comments: true, recognitions: true } },
    },
  });

  const total = await prisma.report.count({ where });

  return { reports, total };
}
