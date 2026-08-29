"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteDocument } from "@/lib/actions/documents";

export function DeleteDocumentButton({ documentId }: { documentId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function del() {
    if (!confirm("Delete this document? This action is audited.")) return;
    setBusy(true);
    setError(null);
    const res = await deleteDocument(documentId);
    if (!res.ok) {
      setError(res.error);
      setBusy(false);
      return;
    }
    router.push("/documents");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      {error && <p className="text-xs text-danger">{error}</p>}
      <button
        onClick={del}
        disabled={busy}
        className="rounded-md border border-danger/40 px-3 py-1.5 text-xs font-medium text-danger hover:bg-red-50 disabled:opacity-50"
      >
        {busy ? "Deleting..." : "Delete document"}
      </button>
    </div>
  );
}
