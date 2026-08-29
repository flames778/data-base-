import { requireAuth, requirePermission } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { TeamForm } from "@/components/admin/forms";

export const dynamic = "force-dynamic";

export default async function AdminTeamsPage() {
  const session = await requireAuth();
  await requirePermission("teams.manage", session);

  const [teams, users] = await Promise.all([
    prisma.team.findMany({
      orderBy: { name: "asc" },
      include: {
        manager: { select: { name: true } },
        _count: { select: { members: true } },
      },
    }),
    prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="Teams" description="Manage teams and departments." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Create team" />
          <CardBody>
            <TeamForm users={users} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={`Teams (${teams.length})`} />
          <CardBody className="p-0">
            {teams.length === 0 ? (
              <EmptyState title="No teams yet." />
            ) : (
              <ul className="divide-y divide-border">
                {teams.map((t) => (
                  <li key={t.id} className="px-5 py-3">
                    <p className="font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Manager: {t.manager?.name ?? "None"} · {t._count.members} member(s)
                    </p>
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
