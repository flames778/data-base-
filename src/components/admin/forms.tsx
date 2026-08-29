"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTeam, createReportTemplate } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input, Select, Field } from "@/components/ui/form";

const FIELD_TYPES = ["TEXT", "TEXTAREA", "DATE", "NUMBER", "SELECT", "MULTISELECT", "URL"];

export function TeamForm({ users }: { users: Array<{ id: string; name: string }> }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await createTeam({
      name: String(fd.get("name") ?? ""),
      description: String(fd.get("description") ?? "") || undefined,
      managerId: String(fd.get("managerId") ?? "") || null,
    });
    if (!res.ok) { setError(res.error); setBusy(false); return; }
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {error && <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Team name">
          <Input name="name" required />
        </Field>
        <Field label="Manager (optional)">
          <Select name="managerId">
            <option value="">None</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="Description">
        <Input name="description" />
      </Field>
      <Button type="submit" size="sm" loading={busy}>Create team</Button>
    </form>
  );
}

interface FieldRow {
  key: string;
  label: string;
  type: string;
  required: boolean;
}

export function TemplateForm() {
  const router = useRouter();
  const [fields, setFields] = useState<FieldRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addField() {
    setFields((f) => [...f, { key: "", label: "", type: "TEXT", required: false }]);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const parsedFields = fields
      .filter((f) => f.key && f.label)
      .map((f, i) => ({ ...f, sortOrder: i + 1 }));

    const res = await createReportTemplate({
      name: String(fd.get("name") ?? ""),
      code: String(fd.get("code") ?? ""),
      description: String(fd.get("description") ?? "") || undefined,
      category: String(fd.get("category") ?? "OTHER"),
      fields: parsedFields,
    });
    if (!res.ok) { setError(res.error); setBusy(false); return; }
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {error && <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Name">
          <Input name="name" required />
        </Field>
        <Field label="Code">
          <Input name="code" required placeholder="e.g. site_report" />
        </Field>
        <Field label="Category">
          <Input name="category" defaultValue="OTHER" />
        </Field>
      </div>
      <Field label="Description">
        <Input name="description" />
      </Field>

      <div className="space-y-2">
        <p className="text-sm font-medium">Fields</p>
        {fields.map((f, i) => (
          <div key={i} className="grid gap-2 rounded-md border border-border bg-zinc-50 p-2 sm:grid-cols-4">
            <Input placeholder="Key" value={f.key} onChange={(e) => setFields((s) => s.map((x, j) => j === i ? { ...x, key: e.target.value } : x))} />
            <Input placeholder="Label" value={f.label} onChange={(e) => setFields((s) => s.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} />
            <Select value={f.type} onChange={(e) => setFields((s) => s.map((x, j) => j === i ? { ...x, type: e.target.value } : x))}>
              {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
            <button type="button" className="rounded border border-border bg-white px-2 py-1 text-xs" onClick={() => setFields((s) => s.filter((_, j) => j !== i))}>Remove</button>
          </div>
        ))}
        <button type="button" onClick={addField} className="text-sm font-medium text-primary hover:underline">+ Add field</button>
      </div>

      <Button type="submit" size="sm" loading={busy}>Create template</Button>
    </form>
  );
}
