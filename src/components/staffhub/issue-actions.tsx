"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateIssue } from "@/lib/actions/staffhub";
import { Button } from "@/components/ui/button";
import { Textarea, Select, Field } from "@/components/ui/form";

export function IssueActions({
  issueId,
  currentStatus,
  users,
}: {
  issueId: string;
  currentStatus: string;
  users: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [assignee, setAssignee] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: "review" | "assign" | "start" | "resolve" | "close" | "reopen") {
    setBusy(true);
    setError(null);
    const res = await updateIssue({
      issueId,
      action,
      assigneeId: action === "assign" ? assignee || null : null,
      note: note || undefined,
    });
    if (!res.ok) { setError(res.error); setBusy(false); return; }
    setNote("");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error && <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

      <div>
        <Field label="Assign to">
          <Select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value="">Unassigned</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
        </Field>
        <Button size="sm" variant="secondary" className="mt-2" onClick={() => run("assign")} loading={busy}>
          Assign
        </Button>
      </div>

      <Field label="Note / resolution">
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} className="min-h-[60px]" />
      </Field>

      <div className="flex flex-wrap gap-2">
        {currentStatus === "OPEN" && (
          <Button size="sm" variant="secondary" onClick={() => run("review")}>Mark under review</Button>
        )}
        {currentStatus === "UNDER_REVIEW" && (
          <Button size="sm" variant="secondary" onClick={() => run("start")}>Start</Button>
        )}
        {["OPEN", "UNDER_REVIEW", "ASSIGNED"].includes(currentStatus) && (
          <Button size="sm" variant="secondary" onClick={() => run("resolve")}>Resolve</Button>
        )}
        {["RESOLVED", "IN_PROGRESS", "UNDER_REVIEW", "ASSIGNED", "OPEN"].includes(currentStatus) && (
          <Button size="sm" variant="success" onClick={() => run("close")}>Close</Button>
        )}
        {["CLOSED", "RESOLVED"].includes(currentStatus) && (
          <Button size="sm" variant="ghost" onClick={() => run("reopen")}>Reopen</Button>
        )}
      </div>
    </div>
  );
}
