"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/authz";

import { prisma } from "@/lib/prisma";

/**
 * Mark a notification as read (by the owning user only).
 */
export async function markNotificationRead(notificationId: string) {
  const session = await requireAuth();
  const notif = await prisma.notification.findUnique({
    where: { id: notificationId },
  });
  if (!notif || notif.userId !== session.user.id) {
    return { ok: false as const, error: "Not found." };
  }
  await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
  revalidatePath("/notifications");
  return { ok: true as const };
}

/**
 * Mark all notifications as read for the current user.
 */
export async function markAllNotificationsRead() {
  const session = await requireAuth();
  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });
  revalidatePath("/notifications");
  return { ok: true as const };
}
