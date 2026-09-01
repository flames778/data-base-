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

      <Card className="overflow-hidden rounded-[28px] border border-slate-200 bg-white/90 shadow-[0_18px_35px_rgba(15,23,42,0.04)]">
        <CardBody className="p-0">
          {projects.length === 0 ? (
            <div className="px-5 py-4">
              <EmptyState title="No projects assigned." description="No projects are available to you yet." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/80">
                  <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-[0.12em] text-slate-500">
                    <th className="px-5 py-3 font-semibold">Project</th>
                    <th className="px-5 py-3 font-semibold">Lead</th>
                    <th className="px-5 py-3 font-semibold">Team</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Members</th>
                    <th className="px-5 py-3 font-semibold">Reports</th>
                    <th className="px-5 py-3 font-semibold">Ends</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {projects.map((p) => (
                    <tr key={p.id} className="transition-colors hover:bg-slate-50/90">
                      <td className="px-5 py-3">
                        <a href={`/projects/${p.id}`} className="font-semibold text-blue-700 hover:text-blue-800 hover:underline">
                          {p.name}
                        </a>
                        {p.client && <span className="mt-1 block text-xs text-slate-500">{p.client}</span>}
                      </td>
                      <td className="px-5 py-3 text-slate-600">{p.lead?.name ?? "—"}</td>
                      <td className="px-5 py-3 text-slate-600">{p.team?.name ?? "—"}</td>
                      <td className="px-5 py-3">
                        <Badge tone={statusTone[p.status] ?? "gray"}>{p.status.replace(/_/g, " ")}</Badge>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{p._count.members}</td>
                      <td className="px-5 py-3 text-slate-600">{p._count.reports}</td>
                      <td className="px-5 py-3 text-slate-600">
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
