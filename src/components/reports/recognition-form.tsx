"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { giveStaffRecognition } from "@/lib/actions/ceo";
import { Button } from "@/components/ui/button";
import { Input, Field, Textarea, Select } from "@/components/ui/form";
import type { ReportStatus } from "@prisma/client";

const REWARD_TYPES = [
  { value: "excellent_work", label: "Excellent Work" },
  { value: "outstanding_performance", label: "Outstanding Performance" },
  { value: "well_done", label: "Well Done" },
  { value: "recognition_award", label: "Recognition Award" },
];

export function RecognitionForm({
  reportId,
  authorName,
}: {
  reportId: string;
  authorName: string;
}) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    rewardType: "excellent_work",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.rewardType) {
      setError("Please select a reward type.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await giveStaffRecognition({
      recipientId: authorName, // Will need to pass actual recipientId - needs form update
      reportId,
      rewardType: formData.rewardType,
      message: formData.message || undefined,
    });

    if (!res.ok) {
      setError((res as any).error || "Failed to give recognition");
      setLoading(false);
      return;
    }

    router.back();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-900">
        <p>You are awarding recognition to <strong>{authorName}</strong> for their work on this report.</p>
      </div>

      <Field label="Reward Type">
        <Select
          value={formData.rewardType}
          onChange={(e) =>
            setFormData({ ...formData, rewardType: e.target.value })
          }
        >
          {REWARD_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Message (optional)">
        <Textarea
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Leave a personal message or note of appreciation..."
          className="min-h-[120px]"
        />
      </Field>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" variant="success" loading={loading}>
          🏆 Award Recognition
        </Button>
      </div>
    </form>
  );
}
