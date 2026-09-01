import { requireAuth } from "@/lib/authz";
import { getEmployeeDashboard } from "@/lib/dashboard";
import { getUserRecognitions } from "@/services/ceo-reports";
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

export default async function EmployeeDashboard() {
  const session = await requireAuth();
  const data = await getEmployeeDashboard(session);
  const recognitions = await getUserRecognitions(session.user.id);

  return (
    <div>
      <PageHeader
        title={`Welcome, ${session.user.name}`}
        description="Your work overview. All figures come from the live system."
        actions={
          <LinkButton href="/reports/new">Submit Report</LinkButton>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="My reports" value={data.myReportCount} tone="primary" />
        <StatCard label="Pending review" value={data.myPendingReports} tone="amber" />
        <StatCard label="Revisions requested" value={data.myRevisionRequests} tone="red" />
        <StatCard label="Active issues" value={data.myActiveIssues} tone="green" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader
            title="My recent reports"
            action={<Link className="text-xs text-primary hover:underline" href="/reports">View all</Link>}
          />
          <CardBody>
            {data.recentReports.length === 0 ? (
              <EmptyState title="No reports submitted yet." description="Submit your first report to get started." />
            ) : (
              <ul className="divide-y divide-border">
                {data.recentReports.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <a href={`/reports/${r.id}`} className="truncate text-sm font-medium hover:text-primary hover:underline">
                        {r.title}
                      </a>
                      <p className="text-xs text-muted-foreground">
                        {r.templateName}
                        {r.projectName ? ` · ${r.projectName}` : ""} ·{" "}
                        {new Date(r.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge tone={statusTone[r.status] ?? "gray"}>{r.status.replace(/_/g, " ")}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

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
                    <a href={`/projects/${p.id}`} className="truncate text-sm font-medium hover:text-primary hover:underline">
                      {p.name}
                    </a>
                    <Badge tone={p.status === "ACTIVE" ? "green" : "gray"}>{p.status.replace(/_/g, " ")}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="🏆 My Recognition & Awards" />
          <CardBody>
            {recognitions.length === 0 ? (
              <EmptyState title="No awards yet." description="Keep doing great work!" />
            ) : (
              <ul className="divide-y divide-border">
                {recognitions.slice(0, 5).map((r) => (
                  <li key={r.id} className="py-3">
                    <div className="flex items-start gap-3">
                      <div className="text-lg">🏅</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">
                          {r.rewardType.replace(/_/g, " ")}
                        </p>
                        {r.message && (
                          <p className="text-xs text-slate-600 mt-1">&ldquo;{r.message}&rdquo;</p>
                        )}
                        <p className="text-xs text-slate-500 mt-1">
                          by {r.givenBy?.name || "Unknown"} • {new Date(r.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="My issues & challenges"
            action={<a className="text-xs text-primary hover:underline" href="/staff-hub">Staff Hub</a>}
          />
          <CardBody>
            {data.recentIssues.length === 0 ? (
              <EmptyState title="No open challenges." />
            ) : (
              <ul className="divide-y divide-border">
                {data.recentIssues.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-4 py-3">
                    <a href={`/staff-hub/issues/${i.id}`} className="truncate text-sm font-medium hover:text-primary hover:underline">
                      {i.title}
                    </a>
                    <Badge tone={i.priority === "CRITICAL" ? "red" : "amber"}>{i.priority}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="My claims & requests"
            action={<Link className="text-xs text-primary hover:underline" href="/claims">View all</Link>}
          />
          <CardBody>
            {data.myClaims.length === 0 ? (
              <EmptyState title="No claims submitted." />
            ) : (
              <ul className="divide-y divide-border">
                {data.myClaims.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-4 py-3">
                    <a href={`/claims/${c.id}`} className="truncate text-sm font-medium hover:text-primary hover:underline">
                      {c.title}
                    </a>
                    <Badge>{c.status.replace(/_/g, " ")}</Badge>
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
