"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  requireAuth,
  requirePermission,
  NotFoundError,
} from "@/lib/authz";
import { errorResult } from "@/lib/actions/util";
import { claimSchema, claimReviewSchema } from "@/lib/validation";
import { audit, clientInfo } from "@/lib/audit";
import { notify, claimReviewerIds } from "@/lib/notifications";
import { headers } from "next/headers";
import type { ClaimStatus } from "@prisma/client";

/**
 * Create a claim/request.
 */
export async function createClaim(input: {
  claimType: string;
  title: string;
  description: string;
  amount?: number | null;
  projectId?: string | null;
}) {
  const session = await requireAuth();
  await requirePermission("claims.create", session);
  const h = await headers();
  const info = clientInfo(h);

  try {
    const parsed = claimSchema.parse(input);
    const claim = await prisma.claim.create({
      data: {
        claimType: parsed.claimType,
        title: parsed.title,
        description: parsed.description,
        amount: parsed.amount ?? null,
        projectId: parsed.projectId ?? null,
        applicantId: session.user.id,
      },
    });
    await prisma.claimStatusHistory.create({
      data: { claimId: claim.id, toStatus: "SUBMITTED", changedById: session.user.id },
    });

    await audit.user(session.user, {
      action: "claim.created",
      resource: "Claim",
      resourceId: claim.id,
      ipAddress: info.ipAddress,
      userAgent: info.userAgent,
      result: "success",
    });

    const reviewers = await claimReviewerIds();
    await Promise.all(
      reviewers
        .filter((rid) => rid !== session.user.id)
        .map((rid) =>
          notify({
            userId: rid,
            type: "CLAIM_UPDATED",
            title: "New claim submitted",
            message: `${session.user.name} submitted a claim: ${claim.title}`,
            link: `/claims/${claim.id}`,
          })
        )
    );

    revalidatePath("/claims");
    return { ok: true as const, claimId: claim.id };
  } catch (e) {
    return errorResult(e);
  }
}

const STATUS_BY_ACTION: Record<string, ClaimStatus> = {
  approve: "APPROVED",
  reject: "REJECTED",
  resolve: "RESOLVED",
  close: "CLOSED",
};

/**
 * Review a claim (approve/reject/resolve/close).
 */
export async function reviewClaim(input: {
  claimId: string;
  action: "approve" | "reject" | "resolve" | "close";
  note?: string;
  resolution?: string;
}) {
  const session = await requireAuth();
  await requirePermission("claims.review", session);
  const h = await headers();
  const info = clientInfo(h);

  try {
    const parsed = claimReviewSchema.parse(input);
    const claim = await prisma.claim.findUnique({ where: { id: input.claimId } });
    if (!claim) throw new NotFoundError();

    const toStatus = STATUS_BY_ACTION[parsed.action] ?? claim.status;

    const updated = await prisma.$transaction(async (tx) => {
      await tx.claimStatusHistory.create({
        data: {
          claimId: claim.id,
          fromStatus: claim.status,
          toStatus,
          changedById: session.user.id,
          note: parsed.note ?? null,
        },
      });
      return tx.claim.update({
        where: { id: claim.id },
        data: {
          status: toStatus,
          reviewerId: session.user.id,
          reviewerNote: parsed.note ?? claim.reviewerNote,
          resolution: parsed.resolution ?? null,
          resolvedAt:
            toStatus === "RESOLVED" || toStatus === "CLOSED" ? new Date() : null,
        },
      });
    });

    await audit.user(session.user, {
      action: `claim.${parsed.action}`,
      resource: "Claim",
      resourceId: claim.id,
      ipAddress: info.ipAddress,
      userAgent: info.userAgent,
      result: "success",
      metadata: { toStatus },
    });

    await notify({
      userId: claim.applicantId,
      type: "CLAIM_UPDATED",
      title: `Claim ${parsed.action}d`,
      message: `Your claim "${updated.title}" is now ${toStatus.replace(/_/g, " ").toLowerCase()}.`,
      link: `/claims/${claim.id}`,
    });

    revalidatePath(`/claims/${claim.id}`);
    revalidatePath("/claims");
    return { ok: true as const };
  } catch (e) {
    return errorResult(e);
  }
}
