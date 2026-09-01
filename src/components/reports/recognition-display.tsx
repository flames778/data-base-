"use client";

import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RecognitionReward, User } from "@prisma/client";

interface RecognitionWithUser extends RecognitionReward {
  recipient?: User;
  givenBy?: User;
}

export function RecognitionDisplay({
  recognitions,
}: {
  recognitions: RecognitionWithUser[];
}) {
  if (!recognitions.length) return null;

  const rewardTypeLabels: Record<string, string> = {
    excellent_work: "Excellent Work",
    outstanding_performance: "Outstanding Performance",
    well_done: "Well Done",
    recognition_award: "Recognition Award",
  };

  return (
    <Card>
      <CardHeader title="🏆 Recognition & Rewards" />
      <CardBody className="space-y-3">
        {recognitions.map((rec) => (
          <div
            key={rec.id}
            className="rounded-lg border border-amber-200 bg-amber-50 p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <Badge tone="amber" className="mb-2">
                  {rewardTypeLabels[rec.rewardType] || rec.rewardType}
                </Badge>
                {rec.message && (
                  <p className="text-sm font-medium text-slate-700">{rec.message}</p>
                )}
                <p className="mt-1 text-xs text-slate-600">
                  Awarded by {rec.givenBy?.name || "Unknown"} on{" "}
                  {new Date(rec.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
