import { requireAuth, requirePermission } from "@/lib/authz";
import { getAuthorizedReport } from "@/services/reports";
import { PageHeader } from "@/components/ui/page";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { ReviewPanel } from "@/components/reports/review-panel";
import { CommentSection } from "@/components/comments/comment-section";

export const dynamic = "force-dynamic";

const statusTone: Record<string, string> = {
  APPROVED: "green",
  SUBMITTED: "blue",
  UNDER_REVIEW: "blue",
  REVISION_REQUESTED: "amber",
  REJECTED: "red",
  DRAFT: "gray",
  ARCHIVED: "slate",
};

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAuth();
  await requirePermission("reports.view", session);

  const report = await getAuthorizedReport(session, id);

  const canReview =
    (session.user.permissions.includes("reports.approve") ||
      session.user.permissions.includes("reports.review")) &&
    report.authorId !== session.user.id;
  const canEdit = report.authorId === session.user.id;

  const fieldValues: Record<string, string> = {};
  for (const fv of report.fieldValues) fieldValues[fv.fieldKey] = fv.value ?? "";

  return (
    <div>
      <PageHeader
        title={report.title ?? "Untitled report"}
        description={`${report.template.name} · by ${report.author.name}`}
        actions={
          <>
            {canEdit && (
              <LinkButton href={`/reports/${report.id}/edit`} variant="secondary">
                Edit
              </LinkButton>
            )}
          </>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Badge tone={statusTone[report.status] ?? "gray"}>{report.status.replace(/_/g, " ")}</Badge>
        {report.project && (
          <Badge tone="slate">Project: {report.project.name}</Badge>
        )}
        {report.reportingPeriod && (
          <Badge tone="slate">Period: {report.reportingPeriod}</Badge>
        )}
        {report.reportingMonth && (
          <Badge tone="slate">Month: {report.reportingMonth}</Badge>
        )}
        <span className="text-sm text-muted-foreground">
          Submitted {report.submittedAt ? new Date(report.submittedAt).toLocaleString() : "—"}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Report content" />
            <CardBody className="space-y-5">
              {report.template.fields
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((f) => {
                  const v = fieldValues[f.key];
                  if (!v) return null;
                  return (
                    <div key={f.id}>
                      <h4 className="text-sm font-semibold text-muted-foreground">{f.label}</h4>
                      <p className="mt-1 whitespace-pre-wrap text-sm">{v}</p>
                    </div>
                  );
                })}
              {report.template.fields.every((f) => !fieldValues[f.key]) && (
                <p className="text-sm text-muted-foreground">No content recorded.</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <CommentSection
                target={{ reportId: report.id }}
                comments={report.comments.map((c) => ({
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
          {canReview && (
            <Card>
              <CardHeader title="Review" />
              <CardBody>
                <ReviewPanel reportId={report.id} />
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title="Approval history" />
            <CardBody className="p-0">
              {report.statusHistory.length === 0 ? (
                <p className="px-5 py-4 text-sm text-muted-foreground">No status changes yet.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {report.statusHistory.map((h) => (
                    <li key={h.id} className="px-5 py-3">
                      <p className="text-sm">
                        <span className="font-medium">{h.changedBy?.name ?? "System"}</span>{" "}
                        moved to{" "}
                        <Badge tone={statusTone[h.toStatus] ?? "gray"}>
                          {h.toStatus.replace(/_/g, " ")}
                        </Badge>
                      </p>
                      {h.note && <p className="mt-1 text-xs text-muted-foreground">{h.note}</p>}
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {h.createdAt.toLocaleString()}
                      </p>
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
