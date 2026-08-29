"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { reviewReport } from "@/lib/actions/reports";
import { Button } from "@/components/ui/button";
import { Textarea, Field } from "@/components/ui/form";

type Action = "approve" | "reject" | "request_revision" | "archive";

export function ReviewPanel({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: Action) {
    setBusy(action);
    setError(null);
    const res = await reviewReport({ reportId, action, note: note || undefined });
    if (!res.ok) {
      setError(res.error);
      setBusy(null);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}
      <Field label="Review note (optional)">
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note for the author or history." />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button variant="success" onClick={() => run("approve")} loading={busy === "approve"}>
          Approve
        </Button>
        <Button variant="secondary" onClick={() => run("request_revision")} loading={busy === "request_revision"}>
          Request revision
        </Button>
        <Button variant="danger" onClick={() => run("reject")} loading={busy === "reject"}>
          Reject
        </Button>
        <Button variant="ghost" onClick={() => run("archive")} loading={busy === "archive"}>
          Archive
        </Button>
      </div>
    </div>
  );
}
