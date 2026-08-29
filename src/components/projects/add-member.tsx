"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addProjectMember } from "@/lib/actions/projects";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";

export function AddMemberForm({
  projectId,
  users,
  memberIds,
}: {
  projectId: string;
  users: Array<{ id: string; name: string; email: string }>;
  memberIds: string[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState("");
  const [error, setError] = useState<string | null>(null);
  const available = users.filter((u) => !memberIds.includes(u.id));

  async function add() {
    if (!selected) return;
    setError(null);
    const res = await addProjectMember({ projectId, userId: selected });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSelected("");
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Select value={selected} onChange={(e) => setSelected(e.target.value)}>
        <option value="">Add member...</option>
        {available.map((u) => (
          <option key={u.id} value={u.id}>{u.name}</option>
        ))}
      </Select>
      <Button size="sm" onClick={add} disabled={!selected}>Add</Button>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
