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
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-border bg-white/95 px-6 py-3 backdrop-blur-md lg:px-8">
          <div className="hidden lg:block">
            <p className="text-[13px] font-medium text-muted-foreground">
              {new Date().toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/change-password"
              className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm hover:border-border hover:bg-zinc-50 hover:text-foreground"
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
                className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm hover:bg-red-50 hover:border-red-200 hover:text-red-600"
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
