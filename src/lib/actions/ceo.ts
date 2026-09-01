"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  requireAuth,
  requirePermission,
  ForbiddenError,
  NotFoundError,
} from "@/lib/authz";
import { errorResult } from "@/lib/actions/util";
import { completeReport, giveRecognition } from "@/services/ceo-reports";
import { createAuditLog, clientInfo } from "@/lib/audit";
import { headers } from "next/headers";
import type { ReportStatus } from "@prisma/client";

/**
 * Mark a report as completed by the CEO.
 */
export async function markReportCompleted(input: {
  reportId: string;
  status: "COMPLETED" | "SUCCESS";
  note?: string;
}) {
  const session = await requireAuth();
  await requirePermission("reports.complete", session);

  const h = await headers();
  const info = clientInfo(h);

  try {
    const report = await prisma.report.findUnique({
      where: { id: input.reportId },
      select: { id: true, status: true, authorId: true },
    });

    if (!report) {
      return errorResult("Report not found.");
    }

    // Verify we can only mark reports in certain statuses as completed
    const validStatuses = ["SUBMITTED", "UNDER_REVIEW", "RESOLVED", "ACTION_REQUIRED"];
    if (!validStatuses.includes(report.status)) {
      return errorResult(
        `Cannot mark a ${report.status.replace(/_/g, " ")} report as completed.`
      );
    }

    await completeReport(session, input.reportId, input.status, input.note);

    // Revalidate the report detail page
    revalidatePath(`/reports/${input.reportId}`);
    revalidatePath("/reports");

    return { ok: true };
  } catch (e) {
    return errorResult(e);
  }
}

/**
 * Give recognition/reward to a staff member.
 */
export async function giveStaffRecognition(input: {
  recipientId: string;
  reportId?: string;
  rewardType: string;
  message?: string;
}) {
  const session = await requireAuth();
  await requirePermission("staff.recognize", session);

  const h = await headers();
  const info = clientInfo(h);

  try {
    if (!input.recipientId || !input.rewardType) {
      return errorResult("Recipient and reward type are required.");
    }

    // Validate reward type
    const validTypes = [
      "excellent_work",
      "outstanding_performance",
      "well_done",
      "recognition_award",
    ];
    if (!validTypes.includes(input.rewardType)) {
      return errorResult("Invalid reward type.");
    }

    const recognition = await giveRecognition(session, {
      recipientId: input.recipientId,
      reportId: input.reportId,
      rewardType: input.rewardType,
      message: input.message,
    });

    // Revalidate dashboard pages
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/ceo");

    return { ok: true, recognitionId: recognition.id };
  } catch (e) {
    return errorResult(e);
  }
}

/**
 * Update report status to ACTION_REQUIRED (CEO workflow).
 */
export async function setReportActionRequired(input: {
  reportId: string;
  note: string;
}) {
  const session = await requireAuth();
  await requirePermission("reports.view_all", session); // CEO or admin can do this

  const h = await headers();
  const info = clientInfo(h);

  try {
    const report = await prisma.report.findUnique({
      where: { id: input.reportId },
      include: { author: { select: { name: true, email: true } } },
    });

    if (!report) {
      return errorResult("Report not found.");
    }

    // Update status
    const updated = await prisma.report.update({
      where: { id: input.reportId },
      data: { status: "ACTION_REQUIRED" },
    });

    // Create status history
    await prisma.reportStatusHistory.create({
      data: {
        reportId: input.reportId,
        fromStatus: report.status,
        toStatus: "ACTION_REQUIRED",
        changedById: session.user.id,
        note: input.note,
      },
    });

    // Notify author
    await prisma.notification.create({
      data: {
        userId: report.authorId,
        type: "REVISION_REQUESTED",
        title: "Action Required on Report",
        message: `CEO has requested action on your report "${report.title}". ${input.note}`,
        link: `/reports/${input.reportId}`,
      },
    });

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: "REPORT_ACTION_REQUIRED",
      resource: "Report",
      resourceId: input.reportId,
      metadata: {
        reportTitle: report.title,
        authorName: report.author.name,
        note: input.note,
      },
    });

    revalidatePath(`/reports/${input.reportId}`);
    revalidatePath("/reports");

    return { ok: true };
  } catch (e) {
    return errorResult(e);
  }
}

/**
 * Update report status to RESOLVED (CEO workflow).
 */
export async function setReportResolved(input: {
  reportId: string;
  note?: string;
}) {
  const session = await requireAuth();
  await requirePermission("reports.view_all", session);

  const h = await headers();
  const info = clientInfo(h);

  try {
    const report = await prisma.report.findUnique({
      where: { id: input.reportId },
      include: { author: { select: { name: true, email: true } } },
    });

    if (!report) {
      return errorResult("Report not found.");
    }

    // Update status
    await prisma.report.update({
      where: { id: input.reportId },
      data: { status: "RESOLVED" },
    });

    // Create status history
    await prisma.reportStatusHistory.create({
      data: {
        reportId: input.reportId,
        fromStatus: report.status,
        toStatus: "RESOLVED",
        changedById: session.user.id,
        note: input.note || "Issue has been resolved by CEO.",
      },
    });

    // Notify author
    await prisma.notification.create({
      data: {
        userId: report.authorId,
        type: "REPORT_APPROVED",
        title: "Report Marked as Resolved",
        message: `Your report "${report.title}" has been marked as resolved.`,
        link: `/reports/${input.reportId}`,
      },
    });

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: "REPORT_RESOLVED",
      resource: "Report",
      resourceId: input.reportId,
      metadata: {
        reportTitle: report.title,
        authorName: report.author.name,
      },
    });

    revalidatePath(`/reports/${input.reportId}`);
    revalidatePath("/reports");

    return { ok: true };
  } catch (e) {
    return errorResult(e);
  }
}
