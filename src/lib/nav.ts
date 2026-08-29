import { prisma } from "@/lib/prisma";
import type { PermissionKey } from "@/lib/permissions";

/**
 * Authorization helpers for navigation.
 */

export interface NavLink {
  label: string;
  href: string;
  permission?: PermissionKey;
  match: string[]; // path prefixes that highlight this link
}

export function navLinks(): NavLink[] {
  return [
    { label: "Dashboard", href: "/dashboard", match: ["/dashboard"] },
    { label: "Reports", href: "/reports", match: ["/reports"] },
    { label: "Projects", href: "/projects", match: ["/projects"] },
    { label: "Documents", href: "/documents", match: ["/documents"] },
    {
      label: "Vital Documents",
      href: "/documents/vital",
      permission: "documents.view_vital",
      match: ["/documents/vital"],
    },
    { label: "Staff Hub", href: "/staff-hub", match: ["/staff-hub"] },
    { label: "Claims & Requests", href: "/claims", match: ["/claims"] },
    { label: "Employees", href: "/employees", permission: "users.view_all", match: ["/employees"] },
    { label: "Audit Logs", href: "/audit", permission: "audit.view", match: ["/audit"] },
    { label: "Administration", href: "/admin", permission: "permissions.manage", match: ["/admin"] },
    { label: "Search", href: "/search", match: ["/search"] },
  ];
}

export function filterLinks(
  links: NavLink[],
  permissions: PermissionKey[]
): NavLink[] {
  return links.filter(
    (l) => !l.permission || permissions.includes(l.permission)
  );
}

export async function unreadNotificationCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, read: false },
  });
}

export async function recentNotifications(userId: string, take = 10) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
  });
}
