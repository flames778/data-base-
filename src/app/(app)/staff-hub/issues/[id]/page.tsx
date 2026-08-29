import { requireAuth, requirePermission } from "@/lib/authz";
import { getAuthorizedIssue } from "@/services/issues";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IssueActions } from "@/components/staffhub/issue-actions";
import { CommentSection } from "@/components/comments/comment-section";

export const dynamic = "force-dynamic";

const statusTone: Record<string, string> = {
  OPEN: "red",
  UNDER_REVIEW: "blue",
  ASSIGNED: "blue",
  IN_PROGRESS: "amber",
  RESOLVED: "teal",
  CLOSED: "green",
};

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAuth();
  await requirePermission("issues.create", session);
  const issue = await getAuthorizedIssue(session, id);

  const canManage = session.user.permissions.includes("issues.manage");
  const users = canManage
    ? await prisma.user.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <div>
      <PageHeader
        title={issue.title}
        description={`${issue.category.replace(/_/g, " ")} · created by ${issue.creator?.name}`}
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Badge tone={statusTone[issue.status] ?? "gray"}>{issue.status.replace(/_/g, " ")}</Badge>
        <Badge tone={issue.priority === "CRITICAL" ? "red" : issue.priority === "HIGH" ? "amber" : "slate"}>{issue.priority}</Badge>
        {issue.project && <Badge tone="slate">Project: {issue.project.name}</Badge>}
        <span className="text-sm text-muted-foreground">Assignee: {issue.assignee?.name ?? "Unassigned"}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Description" />
            <CardBody>
              <p className="whitespace-pre-wrap text-sm">{issue.description}</p>
            </CardBody>
          </Card>

          {issue.resolution && (
            <Card>
              <CardHeader title="Resolution" />
              <CardBody><p className="whitespace-pre-wrap text-sm">{issue.resolution}</p></CardBody>
            </Card>
          )}

          <Card>
            <CardBody>
              <CommentSection
                target={{ issueId: issue.id }}
                comments={issue.comments.map((c) => ({
                  id: c.id,
                  content: c.content,
                  createdAt: c.createdAt.toISOString(),
                  author: { name: c.author.name },
                }))}
              />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          {canManage && (
            <Card>
              <CardHeader title="Manage issue" />
              <CardBody>
                <IssueActions issueId={issue.id} currentStatus={issue.status} users={users} />
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title="Status history" />
            <CardBody className="p-0">
              {issue.statusHistory.length === 0 ? (
                <p className="px-5 py-4 text-sm text-muted-foreground">No history.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {issue.statusHistory.map((h) => (
                    <li key={h.id} className="px-5 py-3">
                      <p className="text-sm">
                        <span className="font-medium">{h.changedBy?.name ?? "System"}</span> →{" "}
                        <Badge tone={statusTone[h.toStatus] ?? "gray"}>{h.toStatus.replace(/_/g, " ")}</Badge>
                      </p>
                      {h.note && <p className="mt-1 text-xs text-muted-foreground">{h.note}</p>}
                      <p className="mt-0.5 text-xs text-muted-foreground">{h.createdAt.toLocaleString()}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
