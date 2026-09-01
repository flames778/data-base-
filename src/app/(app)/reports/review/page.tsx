import { requireAuth, requirePermission } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import type { Prisma, ReportStatus } from "@prisma/client";
import { PageHeader } from "@/components/ui/page";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

const statusTone: Record<string, string> = {
  SUBMITTED: "blue",
  UNDER_REVIEW: "blue",
  REVISION_REQUESTED: "amber",
  APPROVED: "emerald",
  REJECTED: "red",
  DRAFT: "gray",
  ARCHIVED: "slate",
};

const statuses = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "REVISION_REQUESTED",
  "APPROVED",
  "REJECTED",
  "ARCHIVED",
] as const satisfies readonly ReportStatus[];

export default async function CEOReviewPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    page?: string;
  }>;
}) {
  const session = await requireAuth();
  await requirePermission("reports.view_all", session);

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1"));
  const pageSize = 20;

  // Get filter
  const statusFilter = params.status;
  const statusFilterValues: readonly string[] = statuses;

  // Build query
  const where: Prisma.ReportWhereInput = {};
  if (statusFilter && statusFilterValues.includes(statusFilter)) {
    where.status = statusFilter as ReportStatus;
  }

  // Get count
  const total = await prisma.report.count({ where });

  // Get reports
  const reports = await prisma.report.findMany({
    where,
    include: {
      author: { select: { id: true, name: true } },
      template: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
    orderBy: { submittedAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  // Get status counts
  const stats: Record<string, number> = {};
  for (const s of statuses) {
    stats[s] = await prisma.report.count({ where: { status: s } });
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <PageHeader
        title="Review reports"
        description="Company-wide report oversight and status tracking"
      />

      {/* Status stats */}
      <div className="mb-8 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {statuses.map((status) => (
          <Card key={status} className="text-center">
            <CardBody>
              <p className="text-2xl font-bold">{stats[status]}</p>
              <p className="text-xs text-muted-foreground">{status.replace(/_/g, " ")}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Status filter */}
      <div className="mb-6 flex items-center gap-3">
        <label className="text-sm font-medium">Filter by status:</label>
        <form className="flex gap-2">
          <select
            name="status"
            defaultValue={statusFilter || ""}
            className="rounded border border-input bg-background px-3 py-2 text-sm"
            onChange={(e) => {
              const value = e.target.value ? `?status=${e.target.value}` : "";
              window.location.href = value;
            }}
          >
            <option value="">All statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </form>
      </div>

      {/* Reports table */}
      {reports.length === 0 ? (
        <EmptyState
          title="No reports found"
          description="Try adjusting your filters or check back later"
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Title</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Author</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Template</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Submitted</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-muted/50">
                  <td className="px-6 py-3 text-sm font-medium">{report.title || "Untitled"}</td>
                  <td className="px-6 py-3 text-sm">{report.author.name}</td>
                  <td className="px-6 py-3 text-sm">{report.template.name}</td>
                  <td className="px-6 py-3 text-sm">
                    <Badge tone={statusTone[report.status] ?? "gray"}>
                      {report.status.replace(/_/g, " ")}
                    </Badge>
                  </td>
                  <td className="px-6 py-3 text-sm text-muted-foreground">
                    {report.submittedAt ? new Date(report.submittedAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <a href={`/reports/${report.id}`} className="text-sm text-primary hover:underline">
                      Review
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={`?page=${page - 1}${statusFilter ? `&status=${statusFilter}` : ""}`}
                className="rounded border border-input px-3 py-2 text-sm hover:bg-muted"
              >
                Previous
              </a>
            )}
            {page < totalPages && (
              <a
                href={`?page=${page + 1}${statusFilter ? `&status=${statusFilter}` : ""}`}
                className="rounded border border-input px-3 py-2 text-sm hover:bg-muted"
              >
                Next
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
