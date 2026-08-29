import { requireAuth, requirePermission } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page";
import { Card, CardBody } from "@/components/ui/card";
import { UploadForm } from "@/components/documents/upload-form";
import { getProjectIdsForUser } from "@/lib/dashboard";
import { isStorageConfigured } from "@/services/storage/minio";

export const dynamic = "force-dynamic";

export default async function UploadDocumentPage() {
  const session = await requireAuth();
  await requirePermission("documents.upload", session);

  const isManager =
    session.user.permissions.includes("documents.manage") || session.user.role === "CEO";
  const canVital = session.user.permissions.includes("documents.view_vital");

  let projects: Array<{ id: string; name: string }>;
  if (isManager) {
    projects = await prisma.project.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  } else {
    const projectIds = await getProjectIdsForUser(session.user.id);
    projects = await prisma.project.findMany({
      where: { id: { in: projectIds } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Upload Document"
        description="Files are stored in MinIO (S3-compatible); metadata and version history live in the platform database."
      />
      <Card>
        <CardBody>
          <UploadForm
            projects={projects}
            canVital={canVital}
            storageConfigured={isStorageConfigured()}
          />
        </CardBody>
      </Card>
    </div>
  );
}
