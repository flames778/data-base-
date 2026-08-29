import { requireAuth, requirePermission } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page";
import { TemplateGrid } from "@/components/reports/template-grid";

export const dynamic = "force-dynamic";

export default async function NewReportPage() {
  const session = await requireAuth();
  await requirePermission("reports.submit", session);

  const templates = await prisma.reportTemplate.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { fields: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Submit a Report"
        description="Choose a report template to get started."
      />
      <TemplateGrid templates={templates} />
    </div>
  );
}
