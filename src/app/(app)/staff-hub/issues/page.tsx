import { requireAuth, requirePermission } from "@/lib/authz";
import { listVisibleIssues } from "@/services/issues";
import { PageHeader } from "@/components/ui/page";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const statusTone: Record<string, string> = {
  OPEN: "red",
  UNDER_REVIEW: "blue",
  ASSIGNED: "blue",
  IN_PROGRESS: "amber",
  RESOLVED: "teal",
  CLOSED: "green",
};

export default async function IssuesPage() {
  const session = await requireAuth();
  await requirePermission("issues.create", session);
  const issues = await listVisibleIssues(session);

  return (
    <div>
      <PageHeader
        title="Issues & Challenges"
        description="Track and manage issues across the organization."
        actions={<LinkButton href="/staff-hub/issues/new">Report Issue</LinkButton>}
      />

      <Card>
        <CardBody className="p-0">
          {issues.length === 0 ? (
            <div className="px-5 py-4">
              <EmptyState title="No issues." description="No issues are visible to you." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Issue</th>
                    <th className="px-5 py-3 font-medium">Creator</th>
                    <th className="px-5 py-3 font-medium">Assignee</th>
                    <th className="px-5 py-3 font-medium">Priority</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {issues.map((i) => (
                    <tr key={i.id} className="hover:bg-zinc-50">
                      <td className="px-5 py-3">
                        <a href={`/staff-hub/issues/${i.id}`} className="font-medium text-primary hover:underline">
                          {i.title}
                        </a>
                        {i.project && <span className="block text-xs text-muted-foreground">{i.project.name}</span>}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{i.creator?.name}</td>
                      <td className="px-5 py-3 text-muted-foreground">{i.assignee?.name ?? "—"}</td>
                      <td className="px-5 py-3">
                        <Badge tone={i.priority === "CRITICAL" ? "red" : i.priority === "HIGH" ? "amber" : "slate"}>{i.priority}</Badge>
                      </td>
                      <td className="px-5 py-3"><Badge tone={statusTone[i.status] ?? "gray"}>{i.status.replace(/_/g, " ")}</Badge></td>
                      <td className="px-5 py-3 text-muted-foreground">{new Date(i.updatedAt).toLocaleDateString()}</td>
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
