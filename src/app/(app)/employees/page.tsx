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

      <Card className="overflow-hidden rounded-[28px] border border-slate-200 bg-white/90 shadow-[0_18px_35px_rgba(15,23,42,0.04)]">
        <CardBody className="p-0">
          {users.length === 0 ? (
            <div className="px-5 py-4">
              <EmptyState title="No employees yet." description="Users are created by administrators in the Admin area." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/80">
                  <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-[0.12em] text-slate-500">
                    <th className="px-5 py-3 font-semibold">Employee</th>
                    <th className="px-5 py-3 font-semibold">Department</th>
                    <th className="px-5 py-3 font-semibold">Role</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Last login</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {users.map((u) => (
                    <tr key={u.id} className="transition-colors hover:bg-slate-50/90">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-slate-900">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{u.department ?? "—"}</td>
                      <td className="px-5 py-3">
                        <Badge tone={u.role.name === "CEO" ? "purple" : u.role.name === "ADMIN" ? "red" : u.role.name === "PROJECT_LEAD" ? "blue" : "slate"}>
                          {u.role.displayName}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone={u.status === "ACTIVE" ? "green" : "red"}>{u.status}</Badge>
                      </td>
                      <td className="px-5 py-3 text-slate-600">
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
