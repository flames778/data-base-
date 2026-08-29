import { prisma } from "@/lib/prisma";
import type { Session } from "next-auth";
import { ForbiddenError, NotFoundError } from "@/lib/authz";

export async function listVisibleClaims(session: Session) {
  const userId = session.user.id;
  const perms = session.user.permissions;

  const canReview =
    perms.includes("claims.review") || perms.includes("claims.manage");

  const claims = await prisma.claim.findMany({
    where: canReview
      ? undefined
      : { applicantId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      applicant: { select: { name: true } },
      project: { select: { name: true } },
    },
  });

  return claims;
}

export async function getAuthorizedClaim(session: Session, claimId: string) {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    include: {
      applicant: { select: { id: true, name: true, email: true } },
      project: true,
      reviewer: { select: { name: true } },
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
  if (!claim) throw new NotFoundError();

  const canReview =
    session.user.permissions.includes("claims.review") ||
    session.user.permissions.includes("claims.manage");
  if (claim.applicantId !== session.user.id && !canReview) {
    throw new ForbiddenError();
  }
  return claim;
}
