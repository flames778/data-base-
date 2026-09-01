import { requireAuth, requirePermission } from "@/lib/authz";
import { listVisibleReports } from "@/services/reports";
import { PageHeader } from "@/components/ui/page";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";

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

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; project?: string }>;
}) {
  const session = await requireAuth();
  await requirePermission("reports.view", session);
  const { status, project } = await searchParams;

  const reports = await listVisibleReports(session, {
    status: status as never,
    projectId: project,
  });

  const statusFilter = status ?? "all";

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Reports you can view, based on your role and assignments."
        actions={<LinkButton href="/reports/new">Submit Report</LinkButton>}
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {(["all", "DRAFT", "SUBMITTED", "UNDER_REVIEW", "REVISION_REQUESTED", "APPROVED", "REJECTED"] as const).map((s) => (
          <a
            key={s}
            href={`/reports${s === "all" ? "" : `?status=${s}`}`}
            className={`rounded-full border px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] ${
              statusFilter === s
                ? "border-blue-600 bg-blue-600 text-white shadow-[0_10px_20px_rgba(37,99,235,0.25)]"
                : "border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
            }`}
          >
            {s === "all" ? "All" : s.replace(/_/g, " ")}
          </a>
        ))}
      </div>

      <Card className="overflow-hidden rounded-[28px] border border-slate-200 bg-white/90 shadow-[0_18px_35px_rgba(15,23,42,0.04)]">
        <CardBody className="p-0">
          {reports.length === 0 ? (
            <div className="px-5 py-4">
              <EmptyState
                title="No reports yet."
                description={statusFilter === "all" ? "No reports have been submitted." : `No reports with status "${statusFilter.replace(/_/g, " ")}".`}
                action={<LinkButton href="/reports/new" size="sm">Submit Report</LinkButton>}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/80">
                  <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-[0.12em] text-slate-500">
                    <th className="px-5 py-3 font-semibold">Report</th>
                    <th className="px-5 py-3 font-semibold">Author</th>
                    <th className="px-5 py-3 font-semibold">Template</th>
                    <th className="px-5 py-3 font-semibold">Project</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {reports.map((r) => (
                    <tr key={r.id} className="transition-colors hover:bg-slate-50/90">
                      <td className="px-5 py-3">
                        <a href={`/reports/${r.id}`} className="font-semibold text-blue-700 hover:text-blue-800 hover:underline">
                          {r.title ?? "Untitled"}
                        </a>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{r.author.name}</td>
                      <td className="px-5 py-3 text-slate-600">{r.template.name}</td>
                      <td className="px-5 py-3 text-slate-600">{r.project?.name ?? "—"}</td>
                      <td className="px-5 py-3">
                        <Badge tone={statusTone[r.status] ?? "gray"}>{r.status.replace(/_/g, " ")}</Badge>
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : "—"}
                      </td>
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
