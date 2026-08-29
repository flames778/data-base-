"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth, requirePermission, NotFoundError } from "@/lib/authz";
import { errorResult } from "@/lib/actions/util";
import { audit, clientInfo } from "@/lib/audit";
import { headers } from "next/headers";

/**
 * Soft-delete a document (marks isDeleted; record remains for audit).
 */
export async function deleteDocument(documentId: string) {
  const session = await requireAuth();
  await requirePermission("documents.delete", session);
  const h = await headers();
  const info = clientInfo(h);

  try {
    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundError();

    await prisma.document.update({
      where: { id: documentId },
      data: { isDeleted: true },
    });

    await audit.user(session.user, {
      action: "document.deleted",
      resource: "Document",
      resourceId: documentId,
      ipAddress: info.ipAddress,
      userAgent: info.userAgent,
      result: "success",
      metadata: { title: doc.title },
    });

    revalidatePath("/documents");
    revalidatePath("/documents/vital");
    return { ok: true as const };
  } catch (e) {
    return errorResult(e);
  }
}
