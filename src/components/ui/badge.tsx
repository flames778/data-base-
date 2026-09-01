import type { ReactNode } from "react";

const tones: Record<string, string> = {
  blue: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-100",
  gray: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
  green: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100",
  red: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-100",
  amber: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-100",
  purple: "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-100",
  teal: "bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-100",
  slate: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
};

export function Badge({
  children,
  tone = "gray",
  className = "",
}: {
  children: ReactNode;
  tone?: keyof typeof tones | string;
  className?: string;
}) {
  const cls = tones[tone] ?? tones.gray;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${cls} ${className}`}
    >
      {children}
    </span>
  );
}
