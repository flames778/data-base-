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

      <Card className="overflow-hidden rounded-[28px] border border-slate-200 bg-white/90 shadow-[0_18px_35px_rgba(15,23,42,0.04)]">
        <CardBody className="p-0">
          {claims.length === 0 ? (
            <div className="px-5 py-4">
              <EmptyState title="No claims yet." action={<LinkButton href="/claims/new" size="sm">New Claim</LinkButton>} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/80">
                  <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-[0.12em] text-slate-500">
                    <th className="px-5 py-3 font-semibold">Claim</th>
                    <th className="px-5 py-3 font-semibold">Applicant</th>
                    <th className="px-5 py-3 font-semibold">Type</th>
                    <th className="px-5 py-3 font-semibold">Amount</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {claims.map((c) => (
                    <tr key={c.id} className="transition-colors hover:bg-slate-50/90">
                      <td className="px-5 py-3">
                        <a href={`/claims/${c.id}`} className="font-semibold text-blue-700 hover:text-blue-800 hover:underline">{c.title}</a>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{c.applicant.name}</td>
                      <td className="px-5 py-3 text-slate-600">{c.claimType}</td>
                      <td className="px-5 py-3 text-slate-700">{c.amount != null ? `$${Number(c.amount).toFixed(2)}` : "—"}</td>
                      <td className="px-5 py-3"><Badge tone={statusTone[c.status] ?? "gray"}>{c.status.replace(/_/g, " ")}</Badge></td>
                      <td className="px-5 py-3 text-slate-600">{new Date(c.createdAt).toLocaleDateString()}</td>
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
