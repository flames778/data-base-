import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

const accentClass: Record<string, string> = {
  primary: "stat-accent-primary",
  green:   "stat-accent-green",
  amber:   "stat-accent-amber",
  red:     "stat-accent-red",
  slate:   "stat-accent-slate",
  blue:    "stat-accent-blue",
  purple:  "stat-accent-purple",
};

const iconTones: Record<string, string> = {
  primary: "bg-blue-50 text-blue-600",
  green:   "bg-green-50 text-green-600",
  amber:   "bg-amber-50 text-amber-600",
  red:     "bg-red-50 text-red-600",
  slate:   "bg-slate-100 text-slate-600",
  blue:    "bg-blue-50 text-blue-600",
  purple:  "bg-purple-50 text-purple-600",
};

export function StatCard({
  label,
  value,
  icon,
  tone = "primary",
  href,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: "primary" | "green" | "amber" | "red" | "slate" | "blue" | "purple";
  href?: string;
}) {
  const inner = (
    <div className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-[-0.06em] text-slate-900">{value}</p>
        </div>
        {icon && (
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-inner ${iconTones[tone]}`}>
            {icon}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <Card className={`${accentClass[tone]} overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_35px_rgba(15,23,42,0.04)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_42px_rgba(15,23,42,0.08)]`}>
      {href ? (
        <a href={href} className="block">
          {inner}
        </a>
      ) : (
        inner
      )}
    </Card>
  );
}
