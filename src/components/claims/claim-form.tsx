"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClaim } from "@/lib/actions/claims";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Field } from "@/components/ui/form";

const CLAIM_TYPES = [
  "Work-related claim",
  "Resource request",
  "Expense-related claim",
  "Site-related issue",
  "Equipment issue",
];

export function ClaimForm({ projects }: { projects: Array<{ id: string; name: string }> }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const amt = String(fd.get("amount") ?? "").trim();
    const res = await createClaim({
      claimType: String(fd.get("claimType") ?? ""),
      title: String(fd.get("title") ?? ""),
      description: String(fd.get("description") ?? ""),
      amount: amt ? Number(amt) : null,
      projectId: String(fd.get("projectId") ?? "") || null,
    });
    if (!res.ok) { setError(res.error); setBusy(false); return; }
    router.push(`/claims/${(res as { claimId: string }).claimId}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Claim type">
          <Select name="claimType" defaultValue={CLAIM_TYPES[0]}>
            {CLAIM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </Field>
        <Field label="Amount (optional)">
          <Input name="amount" type="number" step="0.01" min="0" placeholder="0.00" />
        </Field>
      </div>
      <Field label="Title">
        <Input name="title" required />
      </Field>
      <Field label="Project (optional)">
        <Select name="projectId">
          <option value="">No project</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
      </Field>
      <Field label="Description">
        <Textarea name="description" required className="min-h-[140px]" />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" loading={busy}>Submit claim</Button>
      </div>
    </form>
  );
}
