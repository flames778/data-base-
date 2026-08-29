"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createReport } from "@/lib/actions/reports";
import { Spinner } from "@/components/ui/button";

type Template = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  _count: { fields: number };
};

export function TemplateGrid({ templates }: { templates: Template[] }) {
  const router = useRouter();
  const [starting, setStarting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function start(templateId: string) {
    setStarting(templateId);
    setError(null);
    const res = await createReport(templateId);
    if (res.ok && "reportId" in res) {
      router.push(`/reports/${(res as { reportId: string }).reportId}/edit`);
    } else {
      setError((res as { error: string }).error);
      setStarting(null);
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => (
          <div key={t.id} className="rounded-lg border border-border bg-white p-5 shadow-sm">
            <h3 className="font-semibold">{t.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t.description ?? "No description."}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{t._count.fields} fields</p>
            <button
              onClick={() => start(t.id)}
              disabled={starting === t.id}
              className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
            >
              {starting === t.id && <Spinner className="h-4 w-4" />}
              Start
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
