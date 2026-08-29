import { requireAuth, requirePermission } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TemplateForm } from "@/components/admin/forms";

export const dynamic = "force-dynamic";

export default async function AdminTemplatesPage() {
  const session = await requireAuth();
  await requirePermission("reports.manage_templates", session);

  const templates = await prisma.reportTemplate.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      fields: { orderBy: { sortOrder: "asc" } },
      _count: { select: { reports: true } },
    },
  });

  return (
    <div>
      <PageHeader title="Report Templates" description="Configure flexible report field templates." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Create template" />
          <CardBody>
            <TemplateForm />
          </CardBody>
        </Card>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Existing templates</h3>
          {templates.length === 0 ? (
            <EmptyState title="No templates yet." />
          ) : (
            templates.map((t) => (
              <Card key={t.id}>
                <CardHeader
                  title={
                    <span className="flex items-center gap-2">
                      {t.name}
                      <Badge tone="slate">{t._count.reports}</Badge>
                    </span>
                  }
                  description={t.description ?? ""}
                />
                <CardBody>
                  <div className="flex flex-wrap gap-2">
                    {t.fields.map((f) => (
                      <span key={f.id} className="rounded border border-border bg-zinc-50 px-2 py-1 text-xs">
                        {f.label}
                        {f.required && <span className="ml-1 text-red-500">*</span>}
                      </span>
                    ))}
                  </div>
                </CardBody>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
