import { requireAuth, requirePermission, ForbiddenError, NotFoundError } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page";
import { Card, CardBody } from "@/components/ui/card";
import { ReportForm } from "@/components/reports/report-form";
import { getProjectIdsForUser } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export default async function EditReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAuth();
  await requirePermission("reports.edit_own", session);

  const report = await prisma.report.findUnique({
    where: { id },
    include: { fieldValues: true, template: true },
  });
  if (!report) throw new NotFoundError();
  if (report.authorId !== session.user.id)
    throw new ForbiddenError("You can only edit your own reports.");

  if (["APPROVED", "REJECTED", "ARCHIVED"].includes(report.status)) {
    return (
      <PageHeader
        title="Report closed"
        description="This report is no longer editable."
      />
    );
  }

  const template = await prisma.reportTemplate.findUnique({
    where: { id: report.templateId },
    include: { fields: true },
  });
  if (!template) throw new NotFoundError();

  const projectIds = await getProjectIdsForUser(session.user.id);
  const projects = await prisma.project.findMany({
    where: { id: { in: projectIds } },
    select: { id: true, name: true },
  });

  return (
    <div>
      <PageHeader
        title="Edit Report"
        description={`${template.name}${report.status === "REVISION_REQUESTED" ? " — revision requested" : ""}`}
      />
      {report.status === "REVISION_REQUESTED" && report.revisionNote && (
        <div className="mb-4 rounded-md border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Revision requested:</strong> {report.revisionNote}
        </div>
      )}
      <Card>
        <CardBody>
          <ReportForm template={template} projects={projects} report={report} />
        </CardBody>
      </Card>
    </div>
  );
}
