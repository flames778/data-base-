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

      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", "DRAFT", "SUBMITTED", "UNDER_REVIEW", "REVISION_REQUESTED", "APPROVED", "REJECTED"] as const).map((s) => (
          <a
            key={s}
            href={`/reports${s === "all" ? "" : `?status=${s}`}`}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              statusFilter === s
                ? "border-primary bg-primary text-white"
                : "border-border bg-white text-muted-foreground hover:bg-zinc-50"
            }`}
          >
            {s === "all" ? "All" : s.replace(/_/g, " ")}
          </a>
        ))}
      </div>

      <Card>
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
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Report</th>
                    <th className="px-5 py-3 font-medium">Author</th>
                    <th className="px-5 py-3 font-medium">Template</th>
                    <th className="px-5 py-3 font-medium">Project</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reports.map((r) => (
                    <tr key={r.id} className="hover:bg-zinc-50">
                      <td className="px-5 py-3">
                        <a href={`/reports/${r.id}`} className="font-medium text-primary hover:underline">
                          {r.title ?? "Untitled"}
                        </a>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{r.author.name}</td>
                      <td className="px-5 py-3">{r.template.name}</td>
                      <td className="px-5 py-3 text-muted-foreground">{r.project?.name ?? "—"}</td>
                      <td className="px-5 py-3">
                        <Badge tone={statusTone[r.status] ?? "gray"}>{r.status.replace(/_/g, " ")}</Badge>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
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
