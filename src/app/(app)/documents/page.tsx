import { requireAuth, requirePermission } from "@/lib/authz";
import { listVisibleDocuments } from "@/services/documents";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";
import { DocumentList } from "@/components/documents/document-list";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const session = await requireAuth();
  await requirePermission("documents.view", session);
  const docs = await listVisibleDocuments(session);
  const canUpload = session.user.permissions.includes("documents.upload");

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Company, project and shared documents you are authorized to access."
        actions={
          canUpload ? (
            <LinkButton href="/documents/upload">Upload Document</LinkButton>
          ) : undefined
        }
      />

      <div className="mb-4 flex gap-2">
        <Link href="/documents" className="rounded-full border border-primary bg-primary px-3 py-1 text-xs font-medium text-white">
          Standard documents
        </Link>
        <Link href="/documents/vital" className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-zinc-50">
          Vital documents
        </Link>
      </div>

      <Card>
        <CardBody className="p-0">
          {docs.length === 0 ? (
            <div className="px-5 py-4">
              <EmptyState
                title="No documents yet."
                description={canUpload ? "Upload a document to get started." : "No documents are available to you."}
                action={canUpload ? <LinkButton href="/documents/upload" size="sm">Upload Document</LinkButton> : undefined}
              />
            </div>
          ) : (
            <DocumentList docs={docs as never} />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
