import { requireAuth, requirePermission } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  const session = await requireAuth();
  await requirePermission("users.view_all", session);

  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    include: {
      role: { select: { displayName: true, name: true } },
    },
  });

  return (
    <div>
      <PageHeader title="Employees" description="All registered employees." />

      <Card>
        <CardBody className="p-0">
          {users.length === 0 ? (
            <div className="px-5 py-4">
              <EmptyState title="No employees yet." description="Users are created by administrators in the Admin area." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Employee</th>
                    <th className="px-5 py-3 font-medium">Department</th>
                    <th className="px-5 py-3 font-medium">Role</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Last login</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-50">
                      <td className="px-5 py-3">
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{u.department ?? "—"}</td>
                      <td className="px-5 py-3">
                        <Badge tone={u.role.name === "CEO" ? "purple" : u.role.name === "ADMIN" ? "red" : u.role.name === "PROJECT_LEAD" ? "blue" : "slate"}>
                          {u.role.displayName}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone={u.status === "ACTIVE" ? "green" : "red"}>{u.status}</Badge>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "Never"}
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
