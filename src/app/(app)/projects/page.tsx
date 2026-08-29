import { requireAuth, requirePermission } from "@/lib/authz";
import { listVisibleProjects } from "@/services/projects";
import { PageHeader } from "@/components/ui/page";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const statusTone: Record<string, string> = {
  ACTIVE: "green",
  PLANNING: "blue",
  ON_HOLD: "amber",
  COMPLETED: "slate",
  CANCELLED: "red",
};

export default async function ProjectsPage() {
  const session = await requireAuth();
  await requirePermission("projects.view", session);
  const projects = await listVisibleProjects(session);

  const canManage = session.user.permissions.includes("projects.manage");

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Projects you are part of or have permission to view."
        actions={
          canManage ? (
            <LinkButton href="/projects/new">New Project</LinkButton>
          ) : undefined
        }
      />

      <Card>
        <CardBody className="p-0">
          {projects.length === 0 ? (
            <div className="px-5 py-4">
              <EmptyState title="No projects assigned." description="No projects are available to you yet." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Project</th>
                    <th className="px-5 py-3 font-medium">Lead</th>
                    <th className="px-5 py-3 font-medium">Team</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Members</th>
                    <th className="px-5 py-3 font-medium">Reports</th>
                    <th className="px-5 py-3 font-medium">Ends</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {projects.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-50">
                      <td className="px-5 py-3">
                        <a href={`/projects/${p.id}`} className="font-medium text-primary hover:underline">
                          {p.name}
                        </a>
                        {p.client && <span className="block text-xs text-muted-foreground">{p.client}</span>}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{p.lead?.name ?? "—"}</td>
                      <td className="px-5 py-3 text-muted-foreground">{p.team?.name ?? "—"}</td>
                      <td className="px-5 py-3">
                        <Badge tone={statusTone[p.status] ?? "gray"}>{p.status.replace(/_/g, " ")}</Badge>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{p._count.members}</td>
                      <td className="px-5 py-3 text-muted-foreground">{p._count.reports}</td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {p.endDate ? new Date(p.endDate).toLocaleDateString() : "—"}
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
