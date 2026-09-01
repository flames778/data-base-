import type { ReactNode } from "react";
import { Spinner } from "@/components/ui/button";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 rounded-[28px] border border-sky-100 bg-white/80 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.04)] backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_16px_rgba(16,185,129,0.8)]" />
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.04em] text-slate-900">{title}</h1>
          {description && (
            <p className="mt-1 text-[13px] text-slate-500 leading-relaxed">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Loading({
  label = "Loading...",
}: {
  label?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
      <Spinner className="h-5 w-5" />
      <p className="text-[13px]">{label}</p>
    </div>
  );
}
