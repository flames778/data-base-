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
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {icon && (
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconTones[tone]}`}>
            {icon}
          </span>
        )}
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-foreground">{value}</p>
    </div>
  );

  return (
    <Card className={accentClass[tone]}>
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
