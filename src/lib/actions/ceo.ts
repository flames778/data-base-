"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth, requirePermission } from "@/lib/authz";
import { errorResult } from "@/lib/actions/util";
import { completeReport, giveRecognition } from "@/services/ceo-reports";
import { audit } from "@/lib/audit";

/**
 * Mark a report as completed by the CEO.
 */
export async function markReportCompleted(input: {
  reportId: string;
  status: "APPROVED" | "ARCHIVED";
  note?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requireAuth();
  await requirePermission("reports.complete", session);

  try {
    const report = await prisma.report.findUnique({
      where: { id: input.reportId },
      select: { id: true, status: true, authorId: true },
    });

    if (!report) {
      return errorResult("Report not found.");
    }

    // Verify we can only mark reports in certain statuses as completed
    const validStatuses = ["SUBMITTED", "UNDER_REVIEW", "REVISION_REQUESTED", "APPROVED"];
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
}): Promise<
  | { ok: true; recognitionId: string }
  | { ok: false; error: string }
> {
  const session = await requireAuth();
  await requirePermission("staff.recognize", session);

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
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requireAuth();
  await requirePermission("reports.view_all", session); // CEO or admin can do this

  try {
    const report = await prisma.report.findUnique({
      where: { id: input.reportId },
      include: { author: { select: { name: true, email: true } } },
    });

    if (!report) {
      return errorResult("Report not found.");
    }

    // Update status - use REVISION_REQUESTED
    await prisma.report.update({
      where: { id: input.reportId },
      data: { status: "REVISION_REQUESTED" },
    });

    // Create status history
    await prisma.reportStatusHistory.create({
      data: {
        reportId: input.reportId,
        fromStatus: report.status,
        toStatus: "REVISION_REQUESTED",
        changedById: session.user.id,
        note: input.note,
      },
    });

    // Notify author
    await prisma.notification.create({
      data: {
        userId: report.authorId,
        type: "REVISION_REQUESTED",
        title: "Revision Requested for Report",
        message: `CEO has requested a revision on your report "${report.title}". ${input.note}`,
        link: `/reports/${input.reportId}`,
      },
    });

    // Audit log
    await audit.user(session.user, {
      action: "REPORT_REVISION_REQUESTED",
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
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requireAuth();
  await requirePermission("reports.view_all", session);

  try {
    const report = await prisma.report.findUnique({
      where: { id: input.reportId },
      include: { author: { select: { name: true, email: true } } },
    });

    if (!report) {
      return errorResult("Report not found.");
    }

    // Update status - use APPROVED
    await prisma.report.update({
      where: { id: input.reportId },
      data: { status: "APPROVED" },
    });

    // Create status history
    await prisma.reportStatusHistory.create({
      data: {
        reportId: input.reportId,
        fromStatus: report.status,
        toStatus: "APPROVED",
        changedById: session.user.id,
        note: input.note || "Report approved by CEO.",
      },
    });

    // Notify author
    await prisma.notification.create({
      data: {
        userId: report.authorId,
        type: "REPORT_APPROVED",
        title: "Report Approved",
        message: `Your report "${report.title}" has been approved by the CEO.`,
        link: `/reports/${input.reportId}`,
      },
    });

    // Audit log
    await audit.user(session.user, {
      action: "REPORT_APPROVED",
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
