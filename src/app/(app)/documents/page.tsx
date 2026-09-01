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

      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/documents" className="rounded-full border border-blue-600 bg-blue-600 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white shadow-[0_10px_20px_rgba(37,99,235,0.25)]">
          Standard documents
        </Link>
        <Link href="/documents/vital" className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700">
          Vital documents
        </Link>
      </div>

      <Card className="overflow-hidden rounded-[28px] border border-slate-200 bg-white/90 shadow-[0_18px_35px_rgba(15,23,42,0.04)]">
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
