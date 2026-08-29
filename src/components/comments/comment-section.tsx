"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addComment } from "@/lib/actions/comments";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";

export interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  author: { name: string };
}

export function CommentSection({
  target,
  comments,
}: {
  target: {
    reportId?: string;
    postId?: string;
    issueId?: string;
    claimId?: string;
  };
  comments: CommentItem[];
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setBusy(true);
    setError(null);
    const res = await addComment({ ...target, content });
    if (!res.ok) {
      setError(res.error);
      setBusy(false);
      return;
    }
    setContent("");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold">Discussion</h3>

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="rounded-md border border-border bg-white p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{c.author.name}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(c.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{c.content}</p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="space-y-2">
        {error && <p className="text-sm text-danger">{error}</p>}
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a comment..."
          className="min-h-[72px]"
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" loading={busy}>
            Comment
          </Button>
        </div>
      </form>
    </div>
  );
}
