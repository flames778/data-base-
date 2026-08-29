import { requireAuth, requirePermission } from "@/lib/authz";
import { getAuthorizedProject } from "@/services/projects";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";
import { AddMemberForm } from "@/components/projects/add-member";

export const dynamic = "force-dynamic";

const statusTone: Record<string, string> = {
  ACTIVE: "green",
  PLANNING: "blue",
  ON_HOLD: "amber",
  COMPLETED: "slate",
  CANCELLED: "red",
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAuth();
  await requirePermission("projects.view", session);
  const project = await getAuthorizedProject(session, id);
  const canManage = session.user.permissions.includes("projects.manage");

  const allUsers = canManage
    ? await prisma.user.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <div>
      <PageHeader
        title={project.name}
        description={project.description ?? "No description."}
        actions={
          canManage ? (
            <LinkButton href="/projects/new" variant="secondary">New Project</LinkButton>
          ) : undefined
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Badge tone={statusTone[project.status] ?? "gray"}>{project.status.replace(/_/g, " ")}</Badge>
        {project.client && <Badge tone="slate">Client: {project.client}</Badge>}
        {project.team && <Badge tone="slate">Team: {project.team.name}</Badge>}
        <span className="text-sm text-muted-foreground">
          Lead: {project.lead?.name ?? "Not assigned"}
        </span>
        <span className="text-sm text-muted-foreground">
          {project.startDate ? `Start ${new Date(project.startDate).toLocaleDateString()}` : ""}
          {project.endDate ? ` · Ends ${new Date(project.endDate).toLocaleDateString()}` : ""}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader
              title="Team members"
              description={`${project.members.length} member(s)`}
              action={
                canManage ? (
                  <AddMemberForm projectId={project.id} users={allUsers} memberIds={project.members.map((m) => m.user.id)} />
                ) : undefined
              }
            />
            <CardBody className="p-0">
              {project.members.length === 0 ? (
                <p className="px-5 py-4 text-sm text-muted-foreground">No members yet.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {project.members.map((m) => (
                    <li key={m.user.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-sm font-medium">{m.user.name}</p>
                        <p className="text-xs text-muted-foreground">{m.user.email}</p>
                      </div>
                      {m.user.id === project.leadId && <Badge tone="green">Lead</Badge>}
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Project reports"
              action={<Link className="text-xs text-primary hover:underline" href="/reports">All reports</Link>}
            />
            <CardBody className="p-0">
              {project.reports.length === 0 ? (
                <p className="px-5 py-4 text-sm text-muted-foreground">No reports for this project yet.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {project.reports.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-4 px-5 py-3">
                      <a href={`/reports/${r.id}`} className="truncate text-sm font-medium text-primary hover:underline">
                        {r.title ?? "Untitled"}
                      </a>
                      <span className="text-xs text-muted-foreground">
                        {r.author.name} · {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader
            title="Issues"
            action={<a className="text-xs text-primary hover:underline" href="/staff-hub">Staff Hub</a>}
          />
          <CardBody className="p-0">
            {project.issues.length === 0 ? (
              <EmptyState title="No issues." />
            ) : (
              <ul className="divide-y divide-border">
                {project.issues.slice(0, 8).map((i) => (
                  <li key={i.id} className="px-5 py-3">
                    <a href={`/staff-hub/issues/${i.id}`} className="text-sm font-medium text-primary hover:underline">
                      {i.title}
                    </a>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge tone={i.priority === "CRITICAL" ? "red" : "amber"}>{i.priority}</Badge>
                      <span className="text-xs text-muted-foreground">{i.status.replace(/_/g, " ")}</span>
                    </div>
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
