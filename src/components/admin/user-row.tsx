"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateUser } from "@/lib/actions/admin";

export function UserRowEdit({
  userId,
  userName,
  initialRoleId,
  initialStatus,
  roles,
}: {
  userId: string;
  userName: string;
  initialRoleId: string;
  initialStatus: string;
  roles: Array<{ id: string; name: string; label: string }>;
}) {
  const router = useRouter();
  const [roleId, setRoleId] = useState(initialRoleId);
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    const res = await updateUser({ userId, roleId, status: status as "ACTIVE" | "DISABLED" });
    if (!res.ok) { setError(res.error); setBusy(false); return; }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{userName}</p>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
      <select
        value={roleId}
        onChange={(e) => setRoleId(e.target.value)}
        className="rounded-md border border-border bg-white px-2 py-1.5 text-sm"
      >
        {roles.map((r) => (
          <option key={r.id} value={r.id}>{r.label}</option>
        ))}
      </select>
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="rounded-md border border-border bg-white px-2 py-1.5 text-sm"
      >
        <option value="ACTIVE">Active</option>
        <option value="DISABLED">Disabled</option>
      </select>
      <button
        onClick={save}
        disabled={busy}
        className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
      >
        {busy ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
