import { requireAuth, requirePermission } from "@/lib/authz";
import { listVisibleClaims } from "@/services/claims";
import { PageHeader } from "@/components/ui/page";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const statusTone: Record<string, string> = {
  SUBMITTED: "blue",
  UNDER_REVIEW: "amber",
  APPROVED: "green",
  REJECTED: "red",
  RESOLVED: "teal",
  CLOSED: "green",
};

export default async function ClaimsListPage() {
  const session = await requireAuth();
  await requirePermission("claims.create", session);
  const claims = await listVisibleClaims(session);

  return (
    <div>
      <PageHeader
        title="Claims & Requests"
        description="Track the claims and requests you've submitted or can review."
        actions={<LinkButton href="/claims/new">New Claim</LinkButton>}
      />

      <Card>
        <CardBody className="p-0">
          {claims.length === 0 ? (
            <div className="px-5 py-4">
              <EmptyState title="No claims yet." action={<LinkButton href="/claims/new" size="sm">New Claim</LinkButton>} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Claim</th>
                    <th className="px-5 py-3 font-medium">Applicant</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">Amount</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {claims.map((c) => (
                    <tr key={c.id} className="hover:bg-zinc-50">
                      <td className="px-5 py-3">
                        <a href={`/claims/${c.id}`} className="font-medium text-primary hover:underline">{c.title}</a>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{c.applicant.name}</td>
                      <td className="px-5 py-3 text-muted-foreground">{c.claimType}</td>
                      <td className="px-5 py-3">{c.amount != null ? `$${Number(c.amount).toFixed(2)}` : "—"}</td>
                      <td className="px-5 py-3"><Badge tone={statusTone[c.status] ?? "gray"}>{c.status.replace(/_/g, " ")}</Badge></td>
                      <td className="px-5 py-3 text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
