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
          <a key={s.href} href={s.href} className="group block rounded-[24px] border border-slate-200 bg-white/90 p-5 shadow-[0_12px_28px_rgba(15,23,42,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-sky-50/60 hover:shadow-[0_18px_32px_rgba(59,130,246,0.08)]">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-sky-50 text-blue-700 ring-1 ring-blue-100">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v18M3 12h18" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-900 group-hover:text-blue-800">{s.title}</h3>
            <p className="mt-1 text-sm text-slate-600">{s.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
