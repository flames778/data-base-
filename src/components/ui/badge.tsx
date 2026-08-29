import type { ReactNode } from "react";

const tones: Record<string, string> = {
  blue: "bg-blue-100 text-blue-800",
  gray: "bg-zinc-100 text-zinc-700",
  green: "bg-green-100 text-green-800",
  red: "bg-red-100 text-red-800",
  amber: "bg-amber-100 text-amber-800",
  purple: "bg-purple-100 text-purple-800",
  teal: "bg-teal-100 text-teal-800",
  slate: "bg-slate-100 text-slate-700",
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
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls} ${className}`}
    >
      {children}
    </span>
  );
}
