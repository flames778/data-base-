import { requireAuth, requirePermission } from "@/lib/authz";
import { getAdminDashboard } from "@/lib/dashboard";
import { PageHeader } from "@/components/ui/page";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";

export default async function AdminDashboard() {
  const session = await requireAuth();
  await requirePermission("dashboard.admin", session);
  const data = await getAdminDashboard();

  return (
    <div>
      <PageHeader
        title="Administration Overview"
        description="System management at a glance. All figures are live."
        actions={
          <LinkButton href="/admin/users" variant="secondary">
            Manage Users
          </LinkButton>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total users" value={data.totalUsers} tone="primary" />
        <StatCard label="Active users" value={data.activeUsers} tone="green" />
        <StatCard label="Teams" value={data.teams} tone="blue" />
        <StatCard label="Projects" value={data.projects} tone="slate" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Reports" value={data.reports} tone="primary" />
        <StatCard label="Issues" value={data.issues} tone="amber" />
        <StatCard label="Claims" value={data.claims} tone="purple" />
        <StatCard label="Documents" value={data.documents} tone="green" />
      </div>

      <Card className="mt-6">
        <CardHeader title="Users by role" />
        <CardBody>
          {data.usersByRole.length === 0 ? (
            <EmptyState title="No users yet." />
          ) : (
            <div className="space-y-3">
              {data.usersByRole.map((u) => (
                <div key={u.role} className="flex items-center justify-between text-sm">
                  <span className="font-medium capitalize">{u.role.replace(/_/g, " ")}</span>
                  <span className="text-muted-foreground">{u.count}</span>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
