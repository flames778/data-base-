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
        <Card className="lg:col-span-2">
          <CardHeader
            title="Projects by status"
            action={<Link className="text-xs text-primary hover:underline" href="/projects">All projects</Link>}
          />
          <CardBody>
            {data.totalProjects === 0 ? (
              <EmptyState title="No projects yet." />
            ) : (
              <div className="space-y-3">
                {(["ACTIVE", "PLANNING", "ON_HOLD", "COMPLETED", "CANCELLED"] as const).map((s) => {
                  const count = data.projectsByStatus[s] ?? 0;
                  if (count === 0) return null;
                  const pct = Math.round((count / data.totalProjects) * 100);
                  return (
                    <div key={s}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium capitalize">{s.replace(/_/g, " ")}</span>
                        <span className="text-muted-foreground">{count}</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded bg-zinc-100">
                        <div
                          className="h-full rounded bg-primary"
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

        <Card>
          <CardHeader
            title="Key documents"
            action={<Link className="text-xs text-primary hover:underline" href="/documents/vital">Vital</Link>}
          />
          <CardBody>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">All documents</span>
                <span className="font-semibold">{data.totalDocuments}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vital documents</span>
                <span className="font-semibold">{data.vitalDocuments}</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Recent activity"
          action={<a className="text-xs text-primary hover:underline" href="/audit">Audit logs</a>}
        />
        <CardBody>
          {data.recentActivity.length === 0 ? (
            <EmptyState title="No recorded activity yet." />
          ) : (
            <ul className="divide-y divide-border">
              {data.recentActivity.map((a) => (
                <li key={a.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <Badge tone="slate">{a.action}</Badge>
                  <span className="text-muted-foreground">by {a.userName ?? "system"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
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
