"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  requireAuth,
  requirePermission,
  ForbiddenError,
  NotFoundError,
} from "@/lib/authz";
import { errorResult } from "@/lib/actions/util";
import { reportSubmitSchema, reportReviewSchema } from "@/lib/validation";
import { canViewReport, canTransition } from "@/services/reports";
import { audit, clientInfo } from "@/lib/audit";
import { notify, projectReviewers } from "@/lib/notifications";
import { headers } from "next/headers";
import type { ReportStatus } from "@prisma/client";

const SUCCESS_REDIRECT = "/reports";

/**
 * Create a new (draft) report for the current user.
 */
export async function createReport(templateId: string) {
  const session = await requireAuth();
  await requirePermission("reports.submit", session);

  try {
    const template = await prisma.reportTemplate.findUnique({
      where: { id: templateId },
    });
    if (!template) return errorResult("Report template not found.");

    const report = await prisma.report.create({
      data: {
        templateId: template.id,
        authorId: session.user.id,
        status: "DRAFT",
        title: `New ${template.name}`,
      },
    });
    return { ok: true, reportId: report.id } as { ok: boolean; reportId: string };
  } catch (e) {
    return errorResult(e);
  }
}

/**
 * Save (draft) or submit a report. Enforces edit-own and submission rules.
 */
export async function saveReport(input: {
  reportId: string;
  title: string;
  projectId?: string | null;
  reportingPeriod?: string | null;
  reportingMonth?: string | null;
  templateId: string;
  fields: Record<string, string | null>;
  submit: boolean;
}) {
  const session = await requireAuth();
  await requirePermission("reports.submit", session);

  const h = await headers();
  const info = clientInfo(h);

  try {
    const parsed = reportSubmitSchema.parse(input);
    const report = await prisma.report.findUnique({
      where: { id: input.reportId },
    });
    if (!report) throw new NotFoundError();
    if (report.authorId !== session.user.id)
      throw new ForbiddenError("You can only edit your own reports.");

    // Cannot submit an already-approved/archived report
    if (["APPROVED", "ARCHIVED", "REJECTED"].includes(report.status)) {
      return errorResult("This report can no longer be edited.");
    }

    const targetStatus: ReportStatus = parsed.submit ? "SUBMITTED" : "DRAFT";

    // If previously revision-requested and now submitting -> SUBMITTED (re-review)
    if (!parsed.submit && report.status === "REVISION_REQUESTED") {
      // stays in a savable state; we keep it draft-like but records via field values
    }

    // Rebuild field values
    const toStatus = parsed.submit ? targetStatus : (report.status === "REVISION_REQUESTED" ? "REVISION_REQUESTED" : "DRAFT");

    const updated = await prisma.$transaction(async (tx) => {
      await tx.reportFieldValue.deleteMany({ where: { reportId: report.id } });

      const fieldEntries = Object.entries(parsed.fields ?? {});
      if (fieldEntries.length > 0) {
        await tx.reportFieldValue.createMany({
          data: fieldEntries
            .filter(([, v]) => v !== null && v !== undefined)
            .map(([key, value]) => ({
              reportId: report.id,
              fieldKey: key,
              fieldLabel: key,
              value: value as string,
            })),
        });
      }

      // Record transition when submitting
      if (parsed.submit && report.status !== "SUBMITTED") {
        await tx.reportStatusHistory.create({
          data: {
            reportId: report.id,
            fromStatus: report.status,
            toStatus: "SUBMITTED",
            changedById: session.user.id,
            note: "Report submitted for review",
          },
        });
      }

      return tx.report.update({
        where: { id: report.id },
        data: {
          title: parsed.title,
          projectId: parsed.projectId ?? null,
          reportingPeriod: parsed.reportingPeriod ?? null,
          reportingMonth: parsed.reportingMonth ?? null,
          status: toStatus,
          submittedAt: parsed.submit ? new Date() : report.submittedAt,
          reviewerId: parsed.submit ? session.user.id : report.reviewerId,
        },
      });
    });

    await audit.user(session.user, {
      action: parsed.submit ? "report.submitted" : "report.saved",
      resource: "Report",
      resourceId: report.id,
      ipAddress: info.ipAddress,
      userAgent: info.userAgent,
      result: "success",
    });

    revalidatePath("/reports");
    revalidatePath(`/reports/${report.id}`);

    if (parsed.submit && updated.projectId) {
      // Notify project reviewers
      const reviewers = await projectReviewers(updated.projectId);
      for (const rid of reviewers) {
        if (rid === session.user.id) continue;
        await notify({
          userId: rid,
          type: "REPORT_SUBMITTED",
          title: "New report submitted",
          message: `${session.user.name} submitted "${updated.title}" for review.`,
          link: `/reports/${updated.id}`,
        });
      }
    }

    if (parsed.submit) redirect(SUCCESS_REDIRECT);
    return { ok: true } as { ok: true };
  } catch (e) {
    if (e instanceof Error && "digest" in (e as never) && (e as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) {
      throw e;
    }
    return errorResult(e);
  }
}

/**
 * Review a report: approve / reject / request revision / archive.
 */
export async function reviewReport(input: {
  reportId: string;
  action: "approve" | "reject" | "request_revision" | "archive";
  note?: string;
}) {
  const session = await requireAuth();
  await requirePermission("reports.approve", session);

  const h = await headers();
  const info = clientInfo(h);

  try {
    const parsed = reportReviewSchema.parse(input);
    const report = await prisma.report.findUnique({
      where: { id: input.reportId },
    });
    if (!report) throw new NotFoundError();

    // lead must be authorized for this report's project
    if (!(await canViewReport(session.user.id, report, session.user.permissions))) {
      throw new ForbiddenError("You do not have permission to review this report.");
    }

    const targetStatus: ReportStatus =
      parsed.action === "approve"
        ? "APPROVED"
        : parsed.action === "reject"
          ? "REJECTED"
          : parsed.action === "request_revision"
            ? "REVISION_REQUESTED"
            : "ARCHIVED";

    if (!canTransition(report.status, targetStatus)) {
      return errorResult(
        `Cannot change report from ${report.status} to ${targetStatus}.`
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.reportStatusHistory.create({
        data: {
          reportId: report.id,
          fromStatus: report.status,
          toStatus: targetStatus,
          changedById: session.user.id,
          note: parsed.note ?? null,
        },
      });
      return tx.report.update({
        where: { id: report.id },
        data: {
          status: targetStatus,
          approvedById: targetStatus === "APPROVED" ? session.user.id : null,
          approvedAt: targetStatus === "APPROVED" ? new Date() : null,
          revisionNote: parsed.action === "request_revision" ? parsed.note ?? null : null,
        },
      });
    });

    await audit.user(session.user, {
      action: `report.${parsed.action.replace("_", "_")}`,
      resource: "Report",
      resourceId: report.id,
      ipAddress: info.ipAddress,
      userAgent: info.userAgent,
      result: "success",
      metadata: { action: parsed.action, note: parsed.note },
    });

    // Notify the author
    await notify({
      userId: report.authorId,
      type:
        targetStatus === "APPROVED" ? "REPORT_APPROVED" : "REVISION_REQUESTED",
      title:
        targetStatus === "APPROVED"
          ? "Report approved"
          : parsed.action === "reject"
            ? "Report rejected"
            : "Revision requested",
      message:
        targetStatus === "APPROVED"
          ? `Your report "${updated.title}" was approved.`
          : `Your report "${updated.title}" was ${parsed.action === "reject" ? "rejected" : "sent back for revision"}.${parsed.note ? " Note: " + parsed.note : ""}`,
      link: `/reports/${updated.id}`,
    });

    revalidatePath("/reports");
    revalidatePath(`/reports/${report.id}`);
    redirect(SUCCESS_REDIRECT);
  } catch (e) {
    if (e instanceof Error && "digest" in (e as never) && (e as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) {
      throw e;
    }
    return errorResult(e);
  }
}
