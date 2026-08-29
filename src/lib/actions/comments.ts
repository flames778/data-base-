"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth, requirePermission } from "@/lib/authz";
import { errorResult } from "@/lib/actions/util";
import { commentSchema } from "@/lib/validation";
import { audit } from "@/lib/audit";

/**
 * Add a comment to a report, forum post, issue, or claim.
 * The `target` is validated in the page/route before calling with a name.
 */
export async function addComment(input: {
  content: string;
  reportId?: string | null;
  postId?: string | null;
  issueId?: string | null;
  claimId?: string | null;
}) {
  const session = await requireAuth();
  await requirePermission("forum.comment", session);

  try {
    const parsed = commentSchema.parse(input);

    const comment = await prisma.comment.create({
      data: {
        content: parsed.content,
        authorId: session.user.id,
        reportId: input.reportId ?? null,
        postId: input.postId ?? null,
        issueId: input.issueId ?? null,
        claimId: input.claimId ?? null,
      },
    });

    await audit.user(session.user, {
      action: "comment.created",
      resource: input.reportId ? "Report" : input.postId ? "ForumPost" : input.issueId ? "Issue" : "Claim",
      resourceId: input.reportId ?? input.postId ?? input.issueId ?? input.claimId ?? undefined,
      result: "success",
    });

    if (input.reportId) revalidatePath(`/reports/${input.reportId}`);
    if (input.postId) revalidatePath(`/staff-hub/posts/${input.postId}`);
    if (input.issueId) revalidatePath(`/staff-hub/issues/${input.issueId}`);
    if (input.claimId) revalidatePath(`/claims/${input.claimId}`);

    return { ok: true as const, commentId: comment.id };
  } catch (e) {
    return errorResult(e);
  }
}
