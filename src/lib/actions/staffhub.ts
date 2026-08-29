"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  requireAuth,
  requirePermission,
  NotFoundError,
} from "@/lib/authz";
import { errorResult } from "@/lib/actions/util";
import { forumPostSchema, issueSchema, issueUpdateSchema } from "@/lib/validation";
import { audit, clientInfo } from "@/lib/audit";
import { notify, adminAndCeoIds } from "@/lib/notifications";
import { headers } from "next/headers";
import type { IssueStatus } from "@prisma/client";

/**
 * Create a forum post (authorized by forum.create).
 */
export async function createForumPost(input: {
  title: string;
  content: string;
  category: string;
  projectId?: string | null;
  announce?: boolean;
}) {
  const session = await requireAuth();
  await requirePermission("forum.create", session);
  const h = await headers();
  const info = clientInfo(h);

  try {
    const parsed = forumPostSchema.parse(input);
    const post = await prisma.forumPost.create({
      data: {
        title: parsed.title,
        content: parsed.content,
        category: parsed.category as never,
        projectId: parsed.projectId ?? null,
        authorId: session.user.id,
        isAnnouncement: parsed.announce,
        isPinned: parsed.announce,
      },
    });

    await audit.user(session.user, {
      action: "forum.post_created",
      resource: "ForumPost",
      resourceId: post.id,
      ipAddress: info.ipAddress,
      userAgent: info.userAgent,
      result: "success",
    });

    if (post.isAnnouncement) {
      const recipients = await adminAndCeoIds();
      for (const rid of recipients) {
        if (rid === session.user.id) continue;
        await notify({
          userId: rid,
          type: "ANNOUNCEMENT",
          title: "New announcement",
          message: post.title,
          link: `/staff-hub/posts/${post.id}`,
        });
      }
    }

    revalidatePath("/staff-hub");
    return { ok: true as const, postId: post.id };
  } catch (e) {
    return errorResult(e);
  }
}

/**
 * Create an issue/challenge (authorized by issues.create).
 */
export async function createIssue(input: {
  title: string;
  description: string;
  category: string;
  priority: string;
  visibility: string;
  projectId?: string | null;
}) {
  const session = await requireAuth();
  await requirePermission("issues.create", session);
  const h = await headers();
  const info = clientInfo(h);

  try {
    const parsed = issueSchema.parse(input);
    const issue = await prisma.issue.create({
      data: {
        title: parsed.title,
        description: parsed.description,
        category: parsed.category as never,
        priority: parsed.priority as never,
        visibility: parsed.visibility as never,
        projectId: parsed.projectId ?? null,
        creatorId: session.user.id,
      },
    });

    await prisma.issueStatusHistory.create({
      data: { issueId: issue.id, toStatus: "OPEN", changedById: session.user.id },
    });

    await audit.user(session.user, {
      action: "issue.created",
      resource: "Issue",
      resourceId: issue.id,
      ipAddress: info.ipAddress,
      userAgent: info.userAgent,
      result: "success",
    });

    revalidatePath("/staff-hub");
    return { ok: true as const, issueId: issue.id };
  } catch (e) {
    return errorResult(e);
  }
}

const STATUS_BY_ACTION: Record<string, IssueStatus> = {
  review: "UNDER_REVIEW",
  assign: "ASSIGNED",
  start: "IN_PROGRESS",
  resolve: "RESOLVED",
  close: "CLOSED",
  reopen: "OPEN",
};

/**
 * Update an issue (review/assign/start/resolve/close/reopen).
 */
export async function updateIssue(input: {
  issueId: string;
  action: "review" | "assign" | "start" | "resolve" | "close" | "reopen";
  assigneeId?: string | null;
  resolution?: string;
  note?: string;
}) {
  const session = await requireAuth();
  await requirePermission("issues.manage", session);
  const h = await headers();
  const info = clientInfo(h);

  try {
    const parsed = issueUpdateSchema.parse(input);
    const issue = await prisma.issue.findUnique({ where: { id: input.issueId } });
    if (!issue) throw new NotFoundError();

    const fromStatus = issue.status;
    const toStatus = STATUS_BY_ACTION[parsed.action] ?? fromStatus;

    await prisma.$transaction(async (tx) => {
      await tx.issueStatusHistory.create({
        data: {
          issueId: issue.id,
          fromStatus,
          toStatus,
          changedById: session.user.id,
          note: parsed.note ?? null,
        },
      });
      return tx.issue.update({
        where: { id: issue.id },
        data: {
          status: toStatus,
          assigneeId:
            parsed.action === "assign"
              ? parsed.assigneeId ?? issue.assigneeId
              : issue.assigneeId,
          resolution:
            parsed.action === "resolve" ? parsed.resolution ?? issue.resolution : issue.resolution,
          resolvedAt:
            toStatus === "RESOLVED" || toStatus === "CLOSED"
              ? new Date()
              : null,
        },
      });
    });

    await audit.user(session.user, {
      action: `issue.${parsed.action}`,
      resource: "Issue",
      resourceId: issue.id,
      ipAddress: info.ipAddress,
      userAgent: info.userAgent,
      result: "success",
      metadata: { toStatus },
    });

    // Notify creator + assignee
    await notify({
      userId: issue.creatorId,
      type: "ISSUE_UPDATED",
      title: "Issue updated",
      message: `Issue "${issue.title}" is now ${toStatus.replace(/_/g, " ").toLowerCase()}.`,
      link: `/staff-hub/issues/${issue.id}`,
    });
    if (issue.assigneeId && issue.assigneeId !== issue.creatorId) {
      await notify({
        userId: issue.assigneeId,
        type: "ISSUE_ASSIGNED",
        title: "Issue assigned to you",
        message: issue.title,
        link: `/staff-hub/issues/${issue.id}`,
      });
    }

    revalidatePath(`/staff-hub/issues/${issue.id}`);
    revalidatePath("/staff-hub");
    return { ok: true as const };
  } catch (e) {
    return errorResult(e);
  }
}
