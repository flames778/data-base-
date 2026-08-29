import { requireAuth, requirePermission } from "@/lib/authz";
import { getLeadDashboard } from "@/lib/dashboard";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";

const statusTone: Record<string, string> = {
  APPROVED: "green",
  SUBMITTED: "blue",
  UNDER_REVIEW: "blue",
  REVISION_REQUESTED: "amber",
  REJECTED: "red",
  DRAFT: "gray",
  ARCHIVED: "slate",
};

export default async function ProjectLeadDashboard() {
  const session = await requireAuth();
  await requirePermission("dashboard.project_lead", session);
  const data = await getLeadDashboard(session);

  return (
    <div>
      <PageHeader
        title="Project Lead Overview"
        description="Reports and issues across your projects."
        actions={
          <LinkButton href="/reports">Review Reports</LinkButton>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Projects" value={data.projectCount} tone="primary" />
        <StatCard label="Active projects" value={data.activeProjects} tone="green" />
        <StatCard label="Reports (your projects)" value={data.reportsForLead} tone="blue" />
        <StatCard label="Pending reviews" value={data.pendingReviews} tone="amber" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="My projects"
            action={<Link className="text-xs text-primary hover:underline" href="/projects">View all</Link>}
          />
          <CardBody>
            {data.projects.length === 0 ? (
              <EmptyState title="No projects assigned." />
            ) : (
              <ul className="divide-y divide-border">
                {data.projects.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <a href={`/projects/${p.id}`} className="truncate text-sm font-medium hover:text-primary hover:underline">
                        {p.name}
                      </a>
                      <p className="text-xs text-muted-foreground">
                        {p.endDate ? `Ends ${new Date(p.endDate).toLocaleDateString()}` : "No end date"}
                      </p>
                    </div>
                    <Badge tone={p.status === "ACTIVE" ? "green" : "gray"}>{p.status.replace(/_/g, " ")}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Recent reports to review"
            action={<Link className="text-xs text-primary hover:underline" href="/reports">Review</Link>}
          />
          <CardBody>
            {data.recentReports.length === 0 ? (
              <EmptyState title="No reports submitted in your projects." />
            ) : (
              <ul className="divide-y divide-border">
                {data.recentReports.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <a href={`/reports/${r.id}`} className="truncate text-sm font-medium hover:text-primary hover:underline">
                        {r.title}
                      </a>
                      <p className="text-xs text-muted-foreground">
                        {r.authorName}{r.projectName ? ` · ${r.projectName}` : ""}
                      </p>
                    </div>
                    <Badge tone={statusTone[r.status] ?? "gray"}>{r.status.replace(/_/g, " ")}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
