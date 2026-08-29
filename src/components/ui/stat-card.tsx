import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

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
  const tones: Record<string, string> = {
    primary: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    slate: "bg-slate-50 text-slate-700",
    blue: "bg-blue-50 text-blue-700",
    purple: "bg-purple-50 text-purple-700",
  };
  const inner = (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {icon && <span className={`flex h-8 w-8 items-center justify-center rounded-md ${tones[tone]}`}>{icon}</span>}
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
    </>
  );
  return (
    <Card className="p-5">
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
