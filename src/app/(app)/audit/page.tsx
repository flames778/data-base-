import { requireAuth, requirePermission } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; page?: string }>;
}) {
  const session = await requireAuth();
  await requirePermission("audit.view", session);
  const { action, page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);

  const where = action ? { action } : {};
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: where as never,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.auditLog.count({ where: where as never }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        description="Append-only record of important system activity. Restricted access."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <a href="/audit" className={`rounded-full border px-3 py-1 text-xs font-medium ${!action ? "border-primary bg-primary text-white" : "border-border bg-white text-muted-foreground hover:bg-zinc-50"}`}>All</a>
        {["auth", "report", "document", "user", "issue", "claim", "project", "comment", "forum"].map((a) => (
          <a key={a} href={`/audit?action=${a}`} className={`rounded-full border px-3 py-1 text-xs font-medium ${action === a ? "border-primary bg-primary text-white" : "border-border bg-white text-muted-foreground hover:bg-zinc-50"}`}>
            {a}
          </a>
        ))}
      </div>

      <Card>
        <CardBody className="p-0">
          {logs.length === 0 ? (
            <div className="px-5 py-4">
              <EmptyState title="No audit records." description="Audit entries appear as actions are performed." />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                      <th className="px-5 py-3 font-medium">Action</th>
                      <th className="px-5 py-3 font-medium">User</th>
                      <th className="px-5 py-3 font-medium">Resource</th>
                      <th className="px-5 py-3 font-medium">Result</th>
                      <th className="px-5 py-3 font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {logs.map((l) => (
                      <tr key={l.id} className="hover:bg-zinc-50">
                        <td className="px-5 py-3"><Badge tone="slate">{l.action}</Badge></td>
                        <td className="px-5 py-3 text-muted-foreground">{l.user?.name ?? "System"}</td>
                        <td className="px-5 py-3 text-muted-foreground">{l.resource}{l.resourceId ? `:${l.resourceId.slice(0, 8)}` : ""}</td>
                        <td className="px-5 py-3">
                          <Badge tone={l.result === "success" ? "green" : l.result === "denied" ? "red" : "gray"}>{l.result ?? "—"}</Badge>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">{l.createdAt.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-border px-5 py-3 text-sm">
                <span className="text-muted-foreground">{total} record(s)</span>
                <div className="flex gap-2">
                  {currentPage > 1 && (
                    <a href={`/audit?page=${currentPage - 1}${action ? `&action=${action}` : ""}`} className="text-primary hover:underline">Prev</a>
                  )}
                  <span className="text-muted-foreground">Page {currentPage} of {totalPages}</span>
                  {currentPage < totalPages && (
                    <a href={`/audit?page=${currentPage + 1}${action ? `&action=${action}` : ""}`} className="text-primary hover:underline">Next</a>
                  )}
                </div>
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
