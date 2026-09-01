import { requireAuth, getCurrentUser } from "@/lib/authz";
import { navLinks, filterLinks, unreadNotificationCount, recentNotifications } from "@/lib/nav";
import { SidebarNav } from "@/components/app-shell";
import { NotificationsBell } from "@/components/notifications-bell";
import { signOut } from "@/auth";
import Link from "next/link";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();
  const user = await getCurrentUser(session);

  const links = filterLinks(navLinks(), session.user.permissions);
  const unread = user ? await unreadNotificationCount(user.id) : 0;
  const notes = user ? await recentNotifications(user.id, 8) : [];

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav
        links={links}
        userName={session.user.name ?? user?.name ?? "User"}
        userRole={session.user.role ?? "TEAM_MEMBER"}
        unreadCount={unread}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top header */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-sky-200/80 bg-white/85 px-5 py-3 shadow-sm shadow-sky-100/70 backdrop-blur-xl lg:px-8">
          <div className="hidden lg:flex items-center gap-3">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.95)]" />
            <p className="text-[13px] font-medium text-slate-600">
              {new Date().toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              href="/change-password"
              className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-100"
            >
              Change password
            </Link>
            <NotificationsBell initialCount={unread} notifications={notes as never} />
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 shadow-sm transition hover:bg-red-100 hover:text-red-700"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 px-5 py-6 lg:px-8 page-enter">{children}</main>
      </div>
    </div>
  );
}
