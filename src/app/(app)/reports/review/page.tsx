import { requireAuth, requirePermission } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stat } from "@/components/ui/stat";
import { getCEOReportStats, listReportsForCEO } from "@/services/ceo-reports";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const statusTone: Record<string, string> = {
  SUBMITTED: "blue",
  UNDER_REVIEW: "blue",
  ACTION_REQUIRED: "amber",
  RESOLVED: "emerald",
  COMPLETED: "green",
  SUCCESS: "green",
};

export default async function CEOReviewPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    department?: string;
    template?: string;
    author?: string;
    fromDate?: string;
    toDate?: string;
    page?: string;
  }>;
}) {
  const session = await requireAuth();
  await requirePermission("reports.complete", session);

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1"));
  const pageSize = 20;

  // Get stats
  const stats = await getCEOReportStats();

  // Get filtered reports
  const reports = await listReportsForCEO(session, {
    status: (params.status as any) || undefined,
    department: params.department,
    templateCode: params.template,
    authorId: params.author,
    fromDate: params.fromDate ? new Date(params.fromDate) : undefined,
    toDate: params.toDate ? new Date(params.toDate) : undefined,
    page,
    pageSize,
  });

  // Get unique values for filter dropdowns
  const templates = await prisma.reportTemplate.findMany({
    select: { id: true, code: true, name: true },
  });

  const authors = await prisma.user.findMany({
    where: { role: { in: ["STAFF", "MANAGER", "TEAM_LEAD"] } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const departments = [
    "MTN",
    "Airtel",
    "GLO",
    "9Mobile",
    "Admin",
    "Finance",
    "HR",
    "Operations",
  ];

  return (
    <div>
      <PageHeader
        title="CEO Report Review"
        description="Review and manage company-wide reports"
      />

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Awaiting Review"
          value={stats.submitted}
          tone="blue"
        />
        <Stat
          label="Under Review"
          value={stats.underReview}
          tone="blue"
        />
        <Stat
          label="Action Required"
          value={stats.actionRequired}
          tone="amber"
        />
        <Stat
          label="Resolved"
          value={stats.resolved}
          tone="emerald"
        />
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader title="Filters" />
        <CardBody>
          <form method="get" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Status
              </label>
              <select
                name="status"
                defaultValue={params.status ?? ""}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="SUBMITTED">Awaiting Review</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="ACTION_REQUIRED">Action Required</option>
                <option value="RESOLVED">Resolved</option>
                <option value="COMPLETED">Completed</option>
                <option value="SUCCESS">Success</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Department
              </label>
              <select
                name="department"
                defaultValue={params.department ?? ""}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Template
              </label>
              <select
                name="template"
                defaultValue={params.template ?? ""}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">All Templates</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.code}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Author
              </label>
              <select
                name="author"
                defaultValue={params.author ?? ""}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">All Authors</option>
                {authors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                From Date
              </label>
              <input
                type="date"
                name="fromDate"
                defaultValue={params.fromDate ?? ""}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
                To Date
              </label>
              <input
                type="date"
                name="toDate"
                defaultValue={params.toDate ?? ""}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-6">
              <button
                type="submit"
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Apply Filters
              </button>
              <a
                href="/reports/review"
                className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Clear
              </a>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Reports Table */}
      <Card className="overflow-hidden rounded-[28px] border border-slate-200 bg-white/90 shadow-[0_18px_35px_rgba(15,23,42,0.04)]">
        <CardBody className="p-0">
          {reports.length === 0 ? (
            <div className="px-5 py-8">
              <EmptyState
                title="No reports found"
                description="No reports match the selected filters."
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
                    <th className="px-5 py-3 font-semibold">Department</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Submitted</th>
                    <th className="px-5 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {reports.map((r) => (
                    <tr key={r.id} className="transition-colors hover:bg-slate-50/90">
                      <td className="px-5 py-3">
                        <a
                          href={`/reports/${r.id}`}
                          className="font-semibold text-blue-700 hover:text-blue-800 hover:underline"
                        >
                          {r.title ?? "Untitled"}
                        </a>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{r.author.name}</td>
                      <td className="px-5 py-3 text-slate-600">{r.template.name}</td>
                      <td className="px-5 py-3 text-slate-600">
                        {r.project?.name ?? "—"}
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone={statusTone[r.status] ?? "gray"}>
                          {r.status.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-slate-600 text-xs">
                        {r.submittedAt
                          ? new Date(r.submittedAt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <LinkButton
                          href={`/reports/${r.id}`}
                          variant="secondary"
                          size="sm"
                        >
                          Review
                        </LinkButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Pagination */}
      {reports.length > 0 && (
        <div className="mt-6 flex justify-center gap-2">
          {page > 1 && (
            <a
              href={`/reports/review?page=${page - 1}${params.status ? `&status=${params.status}` : ""}`}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Previous
            </a>
          )}
          <div className="flex items-center px-4 py-2 text-sm text-slate-600">
            Page {page}
          </div>
          {reports.length === pageSize && (
            <a
              href={`/reports/review?page=${page + 1}${params.status ? `&status=${params.status}` : ""}`}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Next
            </a>
          )}
        </div>
      )}
    </div>
  );
}
