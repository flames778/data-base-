"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "@/lib/actions/projects";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Field } from "@/components/ui/form";

interface Props {
  users: Array<{ id: string; name: string }>;
  teams: Array<{ id: string; name: string }>;
}

const STATUSES = ["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"];

export function ProjectForm({ users, teams }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await createProject({
      name: String(fd.get("name") ?? ""),
      description: String(fd.get("description") ?? "") || undefined,
      client: String(fd.get("client") ?? "") || undefined,
      leadId: String(fd.get("leadId") ?? "") || null,
      teamId: String(fd.get("teamId") ?? "") || null,
      status: String(fd.get("status") ?? "PLANNING"),
      startDate: String(fd.get("startDate") ?? "") || null,
      endDate: String(fd.get("endDate") ?? "") || null,
    });
    if (!res.ok) {
      setError(res.error);
      setBusy(false);
      return;
    }
    router.push(`/projects/${(res as { projectId: string }).projectId}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}
      <Field label="Project name" error={error ? undefined : undefined}>
        <Input name="name" required placeholder="e.g. Fiber Backbone Upgrade — North Region" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Client">
          <Input name="client" placeholder="Client name" />
        </Field>
        <Field label="Status">
          <Select name="status" defaultValue="PLANNING">
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Project lead">
          <Select name="leadId">
            <option value="">Select lead</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Team">
          <Select name="teamId">
            <option value="">Select team</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Start date">
          <Input name="startDate" type="date" />
        </Field>
        <Field label="Expected end date">
          <Input name="endDate" type="date" />
        </Field>
      </div>
      <Field label="Description">
        <Textarea name="description" placeholder="Project scope and objectives." />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" loading={busy}>Create project</Button>
      </div>
    </form>
  );
}
