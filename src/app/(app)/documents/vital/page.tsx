import { requireAuth, requirePermission } from "@/lib/authz";
import { listVisibleDocuments } from "@/services/documents";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { DocumentList } from "@/components/documents/document-list";

export const dynamic = "force-dynamic";

export default async function VitalDocumentsPage() {
  const session = await requireAuth();
  await requirePermission("documents.view_vital", session);
  const docs = await listVisibleDocuments(session, { vitalOnly: true });

  return (
    <div>
      <PageHeader
        title="Vital Documents"
        description="Protected confidential company records. Access is restricted and audited."
      />

      <div className="mb-4 flex gap-2">
        <Link href="/documents" className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-zinc-50">
          Standard documents
        </Link>
        <Link href="/documents/vital" className="rounded-full border border-primary bg-primary px-3 py-1 text-xs font-medium text-white">
          Vital documents
        </Link>
      </div>

      <Card>
        <CardBody className="p-0">
          {docs.length === 0 ? (
            <div className="px-5 py-4">
              <EmptyState
                title="No vital documents yet."
                description="Classified company records will appear here when uploaded."
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
