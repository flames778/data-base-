"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUser } from "@/lib/actions/accounts";
import { Button } from "@/components/ui/button";
import { Input, Select, Field } from "@/components/ui/form";

export function CreateUserForm({
  roles,
  teams,
}: {
  roles: Array<{ id: string; label: string }>;
  teams: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setTempPassword(null);

    const fd = new FormData(e.currentTarget);
    const res = await createUser({
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      roleId: String(fd.get("roleId") ?? ""),
      jobTitle: String(fd.get("jobTitle") ?? "") || null,
      department: String(fd.get("department") ?? "") || null,
      teamIds: selectedTeams,
      tempPassword: String(fd.get("tempPassword") ?? "") || undefined,
    });

    if (!res.ok) { setError(res.error ?? "Something went wrong."); setBusy(false); return; }

    if (res.tempPassword) {
      setTempPassword(res.tempPassword as string);
    }
    router.refresh();
    e.currentTarget.reset();
    setSelectedTeams([]);
  }

  function toggleTeam(id: string) {
    setSelectedTeams((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}
      {tempPassword && (
        <div className="rounded-md border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Temporary password (copy now, shown once):</strong>{" "}
          <code className="font-mono">{tempPassword}</code>
          <p className="mt-1 text-xs">
            This password was generated because none was supplied. The user will be
            required to change it at first sign-in. Share it securely — it will not be
            shown again.
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Full name">
          <Input name="name" required />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" required />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Role">
          <Select name="roleId" required>
            <option value="">Select role…</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Department (optional)">
          <Input name="department" />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Job title (optional)">
          <Input name="jobTitle" />
        </Field>
        <Field label="Optional temp password">
          <Input
            name="tempPassword"
            type="password"
            minLength={8}
            placeholder="Leave blank to auto-generate"
          />
        </Field>
      </div>

      {teams.length > 0 && (
        <Field label="Teams">
          <div className="flex flex-wrap gap-2">
            {teams.map((t) => (
              <label
                key={t.id}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm"
              >
                <input
                  type="checkbox"
                  checked={selectedTeams.includes(t.id)}
                  onChange={() => toggleTeam(t.id)}
                />
                {t.name}
              </label>
            ))}
          </div>
        </Field>
      )}

      <div className="flex justify-end">
        <Button type="submit" size="sm" loading={busy}>Create user</Button>
      </div>
    </form>
  );
}
