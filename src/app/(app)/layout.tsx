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
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-border bg-white/90 px-5 py-3 backdrop-blur lg:px-8">
          <div className="hidden lg:block">
            <p className="text-sm font-medium text-muted-foreground">
              {new Date().toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/change-password"
              className="rounded-md border border-border bg-white px-3 py-2 text-sm text-muted-foreground hover:bg-zinc-50"
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
                className="rounded-md border border-border bg-white px-3 py-2 text-sm text-muted-foreground hover:bg-zinc-50"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 px-5 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
