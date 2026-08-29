import { requireAuth, requirePermission } from "@/lib/authz";
import { getAuthorizedDocument } from "@/services/documents";
import { PageHeader } from "@/components/ui/page";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { DeleteDocumentButton } from "@/components/documents/delete-document";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const classificationTone: Record<string, string> = {
  INTERNAL: "slate",
  CONFIDENTIAL: "amber",
  RESTRICTED: "red",
};

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAuth();
  await requirePermission("documents.view", session);
  const doc = await getAuthorizedDocument(session, id);
  const canDelete = session.user.permissions.includes("documents.delete");
  const canDownload = session.user.permissions.includes("documents.download");

  // Record document view in audit log
  await audit.user(session.user, {
    action: "document.viewed",
    resource: "Document",
    resourceId: doc.id,
    result: "success",
  });

  return (
    <div>
      <PageHeader
        title={doc.title}
        description={doc.description ?? "No description."}
        actions={
          <LinkButton href="/documents" variant="ghost">Back to documents</LinkButton>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Badge tone={classificationTone[doc.classification] ?? "slate"}>{doc.classification}</Badge>
        {doc.isVital && <Badge tone="purple">Vital · {doc.vitalCategory?.replace(/_/g, " ")}</Badge>}
        {doc.category && <Badge tone="blue">{doc.category}</Badge>}
        {doc.project && <Badge tone="slate">Project: {doc.project.name}</Badge>}
        <span className="text-sm text-muted-foreground">Version {doc.version}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Details" />
            <CardBody className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-border py-2">
                <span className="text-muted-foreground">File name</span>
                <span className="font-medium">{doc.fileName}</span>
              </div>
              <div className="flex justify-between border-b border-border py-2">
                <span className="text-muted-foreground">File size</span>
                <span className="font-medium">{(doc.fileSize / 1024).toFixed(1)} KB</span>
              </div>
              <div className="flex justify-between border-b border-border py-2">
                <span className="text-muted-foreground">Uploaded by</span>
                <span className="font-medium">{doc.uploader.name}</span>
              </div>
              <div className="flex justify-between border-b border-border py-2">
                <span className="text-muted-foreground">Uploaded at</span>
                <span className="font-medium">{new Date(doc.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Storage</span>
                <span className="font-medium">
                  {doc.storageKey ? "Object storage (MinIO/S3)" : "Not stored"}
                </span>
              </div>
            </CardBody>
          </Card>

          {canDownload && doc.storageKey ? (
            <a
              href={`/api/documents/${doc.id}/download`}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
            >
              Download file
            </a>
          ) : (
            <p className="text-sm text-muted-foreground">
              {doc.storageKey
                ? "You do not have download permission for this document."
                : "File is not stored yet (object storage not configured)."}
            </p>
          )}

          {canDelete && (
            <Card>
              <CardHeader title="Danger zone" />
              <CardBody>
                <DeleteDocumentButton documentId={doc.id} />
              </CardBody>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader title="Version history" description={`${doc.versions.length} version(s)`} />
          <CardBody className="p-0">
            {doc.versions.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted-foreground">No versions.</p>
            ) : (
              <ul className="divide-y divide-border">
                {doc.versions.map((v) => (
                  <li key={v.id} className="px-5 py-3">
                    <p className="flex items-center gap-2 text-sm">
                      <Badge tone="slate">v{v.version}</Badge>
                      <span className="font-medium text-muted-foreground">{v.fileName}</span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      by {v.uploadedBy.name} · {new Date(v.createdAt).toLocaleString()}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{(v.fileSize / 1024).toFixed(1)} KB</p>
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
