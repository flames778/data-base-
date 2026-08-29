import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { canAccessDocument } from "@/services/documents";
import { getPresignedDownloadUrl, isStorageConfigured } from "@/services/storage/minio";
import { audit, clientInfo } from "@/lib/audit";
import { toErrorResponse } from "@/lib/api";

export const runtime = "nodejs";

const PRESIGN_EXPIRY_SECONDS = 300;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireAuth();
    const info = clientInfo(req.headers);

    const doc = await prisma.document.findUnique({
      where: { id },
      select: {
        id: true,
        projectId: true,
        isVital: true,
        classification: true,
        storageKey: true,
        storageProvider: true,
        fileName: true,
        mimeType: true,
      },
    });
    if (!doc) return NextResponse.json({ error: "Resource not found." }, { status: 404 });

    const allowed = await canAccessDocument(session, doc);
    if (!allowed) {
      await audit.user(session.user, {
        action: "document.download_denied",
        resource: "Document",
        resourceId: doc.id,
        ipAddress: info.ipAddress,
        userAgent: info.userAgent,
        result: "denied",
      });
      return NextResponse.json(
        { error: "You do not have permission to access this resource." },
        { status: 403 }
      );
    }

    if (!doc.storageKey || !isStorageConfigured()) {
      return NextResponse.json(
        { error: "Object storage is not configured." },
        { status: 501 }
      );
    }

    // Server-side authz passed: hand out a short-lived presigned URL and
    // redirect the client straight to the object store.
    const url = await getPresignedDownloadUrl(doc.storageKey, PRESIGN_EXPIRY_SECONDS);

    await audit.user(session.user, {
      action: "document.downloaded",
      resource: "Document",
      resourceId: doc.id,
      ipAddress: info.ipAddress,
      userAgent: info.userAgent,
      result: "success",
    });

    return NextResponse.redirect(url);
  } catch (e) {
    return toErrorResponse(e);
  }
}
