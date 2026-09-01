"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  markReportCompleted,
  setReportActionRequired,
  setReportResolved,
} from "@/lib/actions/ceo";
import { Button } from "@/components/ui/button";
import { Textarea, Field } from "@/components/ui/form";
import type { ReportStatus } from "@prisma/client";

export function CEOReportPanel({
  reportId,
  authorId,
  currentStatus,
}: {
  reportId: string;
  authorId: string;
  currentStatus: ReportStatus;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState<string | null>(null);

  async function handleMarkCompleted(status: "COMPLETED" | "SUCCESS") {
    setBusy(status);
    setError(null);
    const res = await markReportCompleted({
      reportId,
      status,
      note: note || undefined,
    });
    if (!res.ok) {
      setError(res.error);
      setBusy(null);
      return;
    }
    setNote("");
    setShowConfirmation(null);
    router.refresh();
  }

  async function handleActionRequired() {
    if (!note.trim()) {
      setError("Please provide a note with the action required.");
      return;
    }
    setBusy("action_required");
    setError(null);
    const res = await setReportActionRequired({ reportId, note });
    if (!res.ok) {
      setError(res.error);
      setBusy(null);
      return;
    }
    setNote("");
    router.refresh();
  }

  async function handleResolved() {
    setBusy("resolved");
    setError(null);
    const res = await setReportResolved({ reportId, note: note || undefined });
    if (!res.ok) {
      setError(res.error);
      setBusy(null);
      return;
    }
    setNote("");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <Field label="Feedback or note (optional)">
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add feedback, instructions, or notes for the report author..."
          className="min-h-[80px]"
        />
      </Field>

      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
          Workflow
        </div>

        {/* Action Required */}
        <Button
          variant="secondary"
          onClick={handleActionRequired}
          loading={busy === "action_required"}
          disabled={busy !== null}
          className="w-full justify-start"
        >
          ⚠️ Request Action
        </Button>

        {/* Resolved */}
        <Button
          variant="success"
          onClick={handleResolved}
          loading={busy === "resolved"}
          disabled={busy !== null}
          className="w-full justify-start"
        >
          ✓ Mark Resolved
        </Button>

        {/* Completion Workflow */}
        <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <div className="text-xs font-semibold text-blue-900">Mark as Completed</div>
          {showConfirmation ? (
            <div className="space-y-2">
              <p className="text-xs text-blue-800">
                Are you sure this report and its required actions have been successfully
                handled?
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowConfirmation(null)}
                  disabled={busy !== null}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => handleMarkCompleted("COMPLETED")}
                  loading={busy === "COMPLETED"}
                >
                  Completed
                </Button>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
                  onClick={() => handleMarkCompleted("SUCCESS")}
                  loading={busy === "SUCCESS"}
                >
                  Success
                </Button>
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
              onClick={() => setShowConfirmation("confirm")}
              disabled={busy !== null}
            >
              Complete This Report
            </Button>
          )}
        </div>
      </div>

      <a
        href={`/reports/${reportId}/recognize`}
        className="block rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        🏆 Give Recognition
      </a>
    </div>
  );
}
