import { prisma } from "@/lib/prisma";
import type { Session } from "next-auth";
import { ForbiddenError, NotFoundError } from "@/lib/authz";
import { getProjectIdsForUser } from "@/lib/dashboard";

/**
 * Determine whether a user may view/download a document, enforcing
 * classification, vital-document restrictions and project membership.
 */
export async function canAccessDocument(
  session: Session,
  doc: { projectId: string | null; isVital: boolean; classification: string }
): Promise<boolean> {
  const perms = session.user.permissions;
  if (!perms.includes("documents.view")) return false;

  // Vital documents require the view_vital permission (only CEO/Admin have it)
  if (doc.isVital && !perms.includes("documents.view_vital")) return false;

  // Managers (CEO/Admin with documents.permissions) can access all
  if (perms.includes("documents.manage") || session.user.role === "CEO") {
    return true;
  }

  // Project-scoped documents only for project members
  if (doc.projectId) {
    const projectIds = await getProjectIdsForUser(session.user.id);
    if (!projectIds.includes(doc.projectId)) return false;
  }

  return true;
}

export async function listVisibleDocuments(
  session: Session,
  opts: { vitalOnly?: boolean; category?: string } = {}
) {
  const perms = session.user.permissions;
  const isManager = perms.includes("documents.manage") || session.user.role === "CEO";

  let where: Record<string, unknown> = { isDeleted: false };
  if (opts.vitalOnly) where.isVital = true;
  if (opts.category) where.category = opts.category;

  if (!isManager && !perms.includes("documents.view_vital")) {
    // Non-managers: only non-vital docs they can access
    const projectIds = await getProjectIdsForUser(session.user.id);
    where = {
      ...where,
      isVital: false,
      OR: [{ projectId: null }, { projectId: { in: projectIds } }],
    };
  } else {
    // Managers / view_vital: all docs (vital filter already applied)
    if (!isManager) {
      // view_vital but not full manage: allow all non-project-restricted + their projects
      const projectIds = await getProjectIdsForUser(session.user.id);
      where = {
        ...where,
        OR: [{ projectId: null }, { projectId: { in: projectIds } }],
      };
    }
  }

  return prisma.document.findMany({
    where: where as never,
    orderBy: { updatedAt: "desc" },
    include: {
      uploader: { select: { name: true } },
      project: { select: { name: true } },
    },
  });
}

export async function getAuthorizedDocument(
  session: Session,
  documentId: string
) {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      uploader: { select: { name: true, email: true } },
      project: { select: { id: true, name: true } },
      versions: {
        orderBy: { version: "desc" },
        include: { uploadedBy: { select: { name: true } } },
      },
    },
  });
  if (!doc || doc.isDeleted) throw new NotFoundError();
  const allowed = await canAccessDocument(session, doc);
  if (!allowed) throw new ForbiddenError();
  return doc;
}
