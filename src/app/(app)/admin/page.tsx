import { requireAuth, requirePermission } from "@/lib/authz";
import { PageHeader } from "@/components/ui/page";

export const dynamic = "force-dynamic";

const SECTIONS = [
  { href: "/admin/users", title: "Users", desc: "Manage roles and account status." },
  { href: "/admin/teams", title: "Teams", desc: "Create and manage teams/departments." },
  { href: "/admin/templates", title: "Report Templates", desc: "Configure report field templates." },
  { href: "/audit", title: "Audit Logs", desc: "Review audited system activity." },
];

export default async function AdminHubPage() {
  const session = await requireAuth();
  await requirePermission("permissions.manage", session);

  return (
    <div>
      <PageHeader title="Administration" description="System management and configuration." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SECTIONS.map((s) => (
          <a key={s.href} href={s.href} className="block rounded-lg border border-border bg-white p-5 shadow-sm transition-colors hover:border-primary/50 hover:bg-accent">
            <h3 className="font-semibold text-primary">{s.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
