"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminResetPassword, setTeamMembership } from "@/lib/actions/accounts";

export function UserAdminActions({
  userId,
  userName,
  teams,
  initialTeamIds,
}: {
  userId: string;
  userName: string;
  teams: Array<{ id: string; name: string }>;
  initialTeamIds: string[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState<string[]>(initialTeamIds);

  async function resetPassword() {
    setBusy(true);
    setError(null);
    setTempPassword(null);
    const res = await adminResetPassword({ userId });
    if (!res.ok) { setError(res.error ?? "Something went wrong."); setBusy(false); return; }
    if (res.tempPassword) setTempPassword(res.tempPassword as string);
    setConfirmReset(false);
    setBusy(false);
  }

  async function saveTeams() {
    setBusy(true);
    setError(null);
    const res = await setTeamMembership({ userId, teamIds: selectedTeams });
    if (!res.ok) { setError(res.error ?? "Something went wrong."); setBusy(false); return; }
    router.refresh();
    setBusy(false);
  }

  function toggleTeam(id: string) {
    setSelectedTeams((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {error && <p className="text-xs text-danger">{error}</p>}
      {tempPassword && (
        <div className="rounded-md border-l-4 border-amber-500 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <strong>Temporary password (shown once):</strong>{" "}
          <code className="font-mono">{tempPassword}</code>
        </div>
      )}
      {!confirmReset ? (
        <button
          onClick={() => setConfirmReset(true)}
          className="w-fit rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-zinc-50"
        >
          Reset password
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Reset {userName}&apos;s password?
          </span>
          <button
            onClick={resetPassword}
            disabled={busy}
            className="rounded-md bg-danger px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Resetting…" : "Confirm"}
          </button>
          <button
            onClick={() => setConfirmReset(false)}
            className="rounded-md border border-border px-3 py-1.5 text-xs"
          >
            Cancel
          </button>
        </div>
      )}

      {teams.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Teams:</span>
          {teams.map((t) => (
            <label
              key={t.id}
              className="flex cursor-pointer items-center gap-1 rounded-md border border-border px-2 py-1 text-xs"
            >
              <input
                type="checkbox"
                checked={selectedTeams.includes(t.id)}
                onChange={() => toggleTeam(t.id)}
              />
              {t.name}
            </label>
          ))}
          <button
            onClick={saveTeams}
            disabled={busy}
            className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-white hover:bg-primary-hover disabled:opacity-50"
          >
            Save teams
          </button>
        </div>
      )}
    </div>
  );
}
