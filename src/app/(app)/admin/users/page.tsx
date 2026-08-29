import { requireAuth, requirePermission } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { UserRowEdit } from "@/components/admin/user-row";
import { CreateUserForm } from "@/components/admin/create-user-form";
import { UserAdminActions } from "@/components/admin/user-admin-actions";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await requireAuth();
  await requirePermission("users.manage", session);

  const [users, roles, teams] = await Promise.all([
    prisma.user.findMany({
      orderBy: { name: "asc" },
      include: {
        role: { select: { name: true } },
        userTeamMemberships: { select: { teamId: true } },
      },
    }),
    prisma.role.findMany({ orderBy: { name: "asc" } }),
    prisma.team.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const roleOptions = roles.map((r) => ({
    id: r.id,
    name: r.name,
    label: r.name.replace(/_/g, " "),
  }));

  return (
    <div>
      <PageHeader title="User Management" description="Create users, assign roles, reset passwords and manage team membership." />

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Add user" description="Send the temporary password to the user securely; they must change it at first login." />
          <CardBody>
            <CreateUserForm roles={roleOptions} teams={teams} />
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="All users" description="Manage roles, status, passwords and team membership." />
          <CardBody className="p-0">
            {users.length === 0 ? (
              <div className="px-5 py-4">
                <EmptyState title="No users yet." description="Create users from the Add user form to get started." />
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {users.map((u) => (
                  <li key={u.id} className="space-y-2 px-5 py-3">
                    <UserRowEdit
                      userId={u.id}
                      userName={`${u.name} (${u.email})`}
                      initialRoleId={u.roleId}
                      initialStatus={u.status}
                      roles={roleOptions}
                    />
                    {u.id !== session.user.id && (
                      <UserAdminActions
                        userId={u.id}
                        userName={u.name}
                        teams={teams}
                        initialTeamIds={u.userTeamMemberships.map((m) => m.teamId)}
                      />
                    )}
                    {u.id === session.user.id && (
                      <Badge tone="slate">You</Badge>
                    )}
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
