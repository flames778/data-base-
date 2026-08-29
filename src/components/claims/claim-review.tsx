"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { reviewClaim } from "@/lib/actions/claims";
import { Button } from "@/components/ui/button";
import { Textarea, Field } from "@/components/ui/form";

export function ClaimReview({ claimId }: { claimId: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [resolution, setResolution] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: "approve" | "reject" | "resolve" | "close") {
    setBusy(action);
    setError(null);
    const res = await reviewClaim({
      claimId,
      action,
      note: note || undefined,
      resolution: resolution || undefined,
    });
    if (!res.ok) { setError(res.error); setBusy(null); return; }
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error && <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      <Field label="Reviewer note">
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} className="min-h-[60px]" />
      </Field>
      <Field label="Resolution">
        <Textarea value={resolution} onChange={(e) => setResolution(e.target.value)} className="min-h-[60px]" />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button variant="success" onClick={() => run("approve")} loading={busy === "approve"}>Approve</Button>
        <Button variant="danger" onClick={() => run("reject")} loading={busy === "reject"}>Reject</Button>
        <Button variant="secondary" onClick={() => run("resolve")} loading={busy === "resolve"}>Resolve</Button>
        <Button variant="ghost" onClick={() => run("close")} loading={busy === "close"}>Close</Button>
      </div>
    </div>
  );
}
