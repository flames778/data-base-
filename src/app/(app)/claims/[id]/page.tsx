import { requireAuth, requirePermission } from "@/lib/authz";
import { getAuthorizedClaim } from "@/services/claims";
import { PageHeader } from "@/components/ui/page";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClaimReview } from "@/components/claims/claim-review";
import { CommentSection } from "@/components/comments/comment-section";

export const dynamic = "force-dynamic";

const statusTone: Record<string, string> = {
  SUBMITTED: "blue",
  UNDER_REVIEW: "amber",
  APPROVED: "green",
  REJECTED: "red",
  RESOLVED: "teal",
  CLOSED: "green",
};

export default async function ClaimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAuth();
  await requirePermission("claims.create", session);
  const claim = await getAuthorizedClaim(session, id);

  const canReview =
    session.user.permissions.includes("claims.review") ||
    session.user.permissions.includes("claims.manage");

  return (
    <div>
      <PageHeader title={claim.title} description={`${claim.claimType} · by ${claim.applicant.name}`} />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Badge tone={statusTone[claim.status] ?? "gray"}>{claim.status.replace(/_/g, " ")}</Badge>
        {claim.amount != null && <Badge tone="amber">Amount: ${Number(claim.amount).toFixed(2)}</Badge>}
        {claim.project && <Badge tone="slate">Project: {claim.project.name}</Badge>}
        <span className="text-sm text-muted-foreground">
          Submitted {new Date(claim.createdAt).toLocaleString()}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Description" />
            <CardBody><p className="whitespace-pre-wrap text-sm">{claim.description}</p></CardBody>
          </Card>

          {claim.reviewerNote && (
            <Card>
              <CardHeader title="Reviewer note" />
              <CardBody>
                <p className="whitespace-pre-wrap text-sm">{claim.reviewerNote}</p>
                <p className="mt-1 text-xs text-muted-foreground">by {claim.reviewer?.name ?? "Reviewer"}</p>
              </CardBody>
            </Card>
          )}

          {claim.resolution && (
            <Card>
              <CardHeader title="Resolution" />
              <CardBody><p className="whitespace-pre-wrap text-sm">{claim.resolution}</p></CardBody>
            </Card>
          )}

          <Card>
            <CardBody>
              <CommentSection
                target={{ claimId: claim.id }}
                comments={claim.comments.map((c) => ({
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
              <CardBody><ClaimReview claimId={claim.id} /></CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title="Status history" />
            <CardBody className="p-0">
              {claim.statusHistory.length === 0 ? (
                <p className="px-5 py-4 text-sm text-muted-foreground">No history.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {claim.statusHistory.map((h) => (
                    <li key={h.id} className="px-5 py-3">
                      <p className="text-sm">
                        <span className="font-medium">{h.changedBy?.name ?? "System"}</span> →{" "}
                        <Badge tone={statusTone[h.toStatus] ?? "gray"}>{h.toStatus.replace(/_/g, " ")}</Badge>
                      </p>
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
