import { requireAuth, requirePermission } from "@/lib/authz";
import { getCeoDashboard } from "@/lib/dashboard";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export default async function CeoDashboard() {
  const session = await requireAuth();
  await requirePermission("dashboard.ceo", session);
  const data = await getCeoDashboard();

  return (
    <div>
      <PageHeader
        title="Executive Dashboard"
        description="Company-wide overview. All figures are live from the database."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active employees" value={data.totalEmployees} tone="primary" />
        <StatCard label="Active projects" value={data.activeProjects} tone="green" />
        <StatCard label="Reports (30d)" value={data.reportsThisPeriod} tone="blue" />
        <StatCard label="Pending approvals" value={data.pendingReports} tone="amber" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Overdue reports" value={data.overdueReports} tone="red" />
        <StatCard label="Open issues" value={data.openIssues} tone="amber" />
        <StatCard label="Critical issues" value={data.criticalIssues} tone="red" />
        <StatCard label="Documents" value={data.totalDocuments} tone="slate" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden rounded-[28px]">
          <CardHeader
            title="Projects by status"
            action={<Link className="text-xs font-semibold text-blue-700 hover:text-blue-800 hover:underline" href="/projects">All projects</Link>}
          />
          <CardBody>
            {data.totalProjects === 0 ? (
              <EmptyState title="No projects yet." />
            ) : (
              <div className="space-y-4">
                {(["ACTIVE", "PLANNING", "ON_HOLD", "COMPLETED", "CANCELLED"] as const).map((s) => {
                  const count = data.projectsByStatus[s] ?? 0;
                  if (count === 0) return null;
                  const pct = Math.round((count / data.totalProjects) * 100);
                  return (
                    <div key={s}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold capitalize text-slate-700">{s.replace(/_/g, " ")}</span>
                        <span className="text-slate-500">{count}</span>
                      </div>
                      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>

        <Card className="overflow-hidden rounded-[28px]">
          <CardHeader
            title="Key documents"
            action={<Link className="text-xs font-semibold text-blue-700 hover:text-blue-800 hover:underline" href="/documents/vital">Vital</Link>}
          />
          <CardBody>
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2.5">
                <span className="text-slate-600">All documents</span>
                <span className="font-bold text-slate-900">{data.totalDocuments}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-sky-50 px-3 py-2.5">
                <span className="text-sky-700">Vital documents</span>
                <span className="font-bold text-sky-900">{data.vitalDocuments}</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden rounded-[28px]">
        <CardHeader
          title="Administration"
          action={
            <div className="flex gap-2">
              <Link className="text-xs font-semibold text-blue-700 hover:text-blue-800 hover:underline" href="/admin/users">Users</Link>
              <Link className="text-xs font-semibold text-blue-700 hover:text-blue-800 hover:underline" href="/admin/teams">Teams</Link>
              <Link className="text-xs font-semibold text-blue-700 hover:text-blue-800 hover:underline" href="/admin/templates">Templates</Link>
            </div>
          }
        />
        <CardBody>
          <div className="grid gap-3 sm:grid-cols-3">
            <Link href="/admin/users" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 hover:bg-white">
              <p className="text-sm font-semibold text-slate-900">User Management</p>
              <p className="text-xs text-slate-500">Create users, assign roles, reset passwords</p>
            </Link>
            <Link href="/admin/teams" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 hover:bg-white">
              <p className="text-sm font-semibold text-slate-900">Team Management</p>
              <p className="text-xs text-slate-500">Create teams and assign members</p>
            </Link>
            <Link href="/admin/templates" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 hover:bg-white">
              <p className="text-sm font-semibold text-slate-900">Report Templates</p>
              <p className="text-xs text-slate-500">Manage report templates</p>
            </Link>
          </div>
        </CardBody>
      </Card>

      <Card className="mt-6 overflow-hidden rounded-[28px]">
        <CardHeader
          title="Recent activity"
          action={<a className="text-xs font-semibold text-blue-700 hover:text-blue-800 hover:underline" href="/audit">Audit logs</a>}
        />
        <CardBody>
          {data.recentActivity.length === 0 ? (
            <EmptyState title="No recorded activity yet." />
          ) : (
            <ul className="divide-y divide-slate-200">
              {data.recentActivity.map((a) => (
                <li key={a.id} className="flex items-center gap-3 py-3 text-sm">
                  <Badge tone="slate">{a.action}</Badge>
                  <span className="text-slate-600">by {a.userName ?? "system"}</span>
                  <span className="ml-auto text-xs text-slate-500">
                    {new Date(a.createdAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
