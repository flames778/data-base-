import { requireAuth, requirePermission } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page";
import { RecognitionForm } from "@/components/reports/recognition-form";
import { Card, CardHeader, CardBody } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function RecognitionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAuth();
  await requirePermission("staff.recognize", session);

  const report = await prisma.report.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      authorId: true,
      author: { select: { name: true } },
    },
  });

  if (!report) {
    return <div className="text-red-600">Report not found.</div>;
  }

  return (
    <div>
      <PageHeader
        title="Give Recognition"
        description={`Award recognition for work on: ${report.title}`}
      />

      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader title="Recognition Details" />
          <CardBody>
            <RecognitionForm reportId={report.id} authorName={report.author.name} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
