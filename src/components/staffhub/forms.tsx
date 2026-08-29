"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createForumPost, createIssue } from "@/lib/actions/staffhub";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Field } from "@/components/ui/form";

export function PostForm({ projects }: { projects: Array<{ id: string; name: string }> }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await createForumPost({
      title: String(fd.get("title") ?? ""),
      content: String(fd.get("content") ?? ""),
      category: String(fd.get("category") ?? "QUESTIONS"),
      projectId: String(fd.get("projectId") ?? "") || null,
      announce: fd.get("announce") === "on",
    });
    if (!res.ok) { setError(res.error); setBusy(false); return; }
    router.push(`/staff-hub/posts/${(res as { postId: string }).postId}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      <Field label="Title">
        <Input name="title" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category">
          <Select name="category" defaultValue="QUESTIONS">
            {["QUESTIONS", "SUGGESTIONS", "TECHNICAL_ISSUES", "CHALLENGES", "CLAIMS", "ANNOUNCEMENTS"].map((c) => (
              <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
            ))}
          </Select>
        </Field>
        <Field label="Project (optional)">
          <Select name="projectId">
            <option value="">No project</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="Announcement">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="announce" className="h-4 w-4" />
          Pin as announcement (notifies management)
        </label>
      </Field>
      <Field label="Content">
        <Textarea name="content" required className="min-h-[160px]" />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" loading={busy}>Post</Button>
      </div>
    </form>
  );
}

export function IssueForm({ projects }: { projects: Array<{ id: string; name: string }> }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await createIssue({
      title: String(fd.get("title") ?? ""),
      description: String(fd.get("description") ?? ""),
      category: "TECHNICAL_ISSUES",
      priority: String(fd.get("priority") ?? "MEDIUM"),
      visibility: String(fd.get("visibility") ?? "PROJECT"),
      projectId: String(fd.get("projectId") ?? "") || null,
    });
    if (!res.ok) { setError(res.error); setBusy(false); return; }
    router.push(`/staff-hub/issues/${(res as { issueId: string }).issueId}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      <Field label="Title">
        <Input name="title" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Priority">
          <Select name="priority" defaultValue="MEDIUM">
            {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((p) => <option key={p} value={p}>{p}</option>)}
          </Select>
        </Field>
        <Field label="Visibility">
          <Select name="visibility" defaultValue="PROJECT">
            {["PROJECT", "TEAM", "MANAGEMENT", "PRIVATE"].map((v) => <option key={v} value={v}>{v}</option>)}
          </Select>
        </Field>
        <Field label="Project (optional)">
          <Select name="projectId">
            <option value="">No project</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="Description">
        <Textarea name="description" required className="min-h-[140px]" />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" loading={busy}>Report issue</Button>
      </div>
    </form>
  );
}
