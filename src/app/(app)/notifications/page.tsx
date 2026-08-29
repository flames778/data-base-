import { requireAuth } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/actions/notifications";

export const dynamic = "force-dynamic";

const typeTone: Record<string, string> = {
  REPORT_DEADLINE: "amber",
  REPORT_SUBMITTED: "blue",
  REPORT_APPROVED: "green",
  REVISION_REQUESTED: "amber",
  ISSUE_ASSIGNED: "purple",
  ISSUE_UPDATED: "slate",
  CLAIM_UPDATED: "teal",
  PROJECT_ASSIGNMENT: "blue",
  ANNOUNCEMENT: "purple",
  COMMENT: "slate",
};

export default async function NotificationsPage() {
  const session = await requireAuth();
  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Recent activity and alerts."
        actions={
          unread > 0 ? (
            <form action={async () => { "use server"; await markAllNotificationsRead(); }}>
              <Button size="sm" variant="secondary" type="submit">Mark all read</Button>
            </form>
          ) : undefined
        }
      />

      <Card>
        <CardBody className="p-0">
          {notifications.length === 0 ? (
            <div className="px-5 py-4">
              <EmptyState title="No notifications." />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((n) => (
                <li key={n.id} className={`flex items-start gap-3 px-5 py-3 ${n.read ? "" : "bg-accent/40"}`}>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 font-medium">
                      {n.title}
                      <Badge tone={typeTone[n.type] ?? "slate"}>{n.type.replace(/_/g, " ")}</Badge>
                      {!n.read && <Badge tone="red">New</Badge>}
                    </p>
                    {n.message && <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>}
                    <p className="mt-0.5 text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {n.link && (
                      <a href={n.link} className="text-xs font-medium text-primary hover:underline">Open</a>
                    )}
                    {!n.read && (
                      <form action={async () => { "use server"; await markNotificationRead(n.id); }}>
                        <button type="submit" className="text-xs text-muted-foreground hover:text-primary">Mark read</button>
                      </form>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
