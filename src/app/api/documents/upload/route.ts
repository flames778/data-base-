import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requirePermission } from "@/lib/authz";
import { audit, clientInfo } from "@/lib/audit";
import { uploadObject, objectKey, isStorageConfigured } from "@/services/storage/minio";
import { documentSchema } from "@/lib/validation";
import { toErrorResponse } from "@/lib/api";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

// Allowlist of allowed extensions / mime types (malware/type validation posture)
const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "image/png",
  "image/jpeg",
]);
const ALLOWED_EXT = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|png|jpe?g)$/i;

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    await requirePermission("documents.upload", session);

    const info = clientInfo(req.headers);

    const formData = await req.formData();

    const file = formData.get("file");
    const title = String(formData.get("title") ?? "");
    const description = String(formData.get("description") ?? "") || undefined;
    const category = String(formData.get("category") ?? "") || undefined;
    const projectId = String(formData.get("projectId") ?? "") || null;
    const classification =
      (String(formData.get("classification") ?? "INTERNAL") as
        | "INTERNAL"
        | "CONFIDENTIAL"
        | "RESTRICTED") ?? "INTERNAL";
    const isVital = formData.get("isVital") === "true" || formData.get("isVital") === "on";
    const vitalCategory = String(formData.get("vitalCategory") ?? "") || undefined;

    if (projectId && (await prisma.project.findUnique({ where: { id: projectId } })) === null) {
      return NextResponse.json(
        { error: "Invalid project." },
        { status: 400 }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided." },
        { status: 400 }
      );
    }

    // ---- Validation ----
    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File is too large. Maximum size is 25 MB." },
        { status: 400 }
      );
    }
    if (file.size === 0) {
      return NextResponse.json({ error: "File is empty." }, { status: 400 });
    }
    const mimeOk = ALLOWED_MIME.has(file.type);
    const extOk = ALLOWED_EXT.test(file.name);
    if (!mimeOk && !extOk) {
      return NextResponse.json(
        { error: "File type not allowed." },
        { status: 400 }
      );
    }

    // ---- MinIO object storage (actual bytes) ----
    if (!isStorageConfigured()) {
      return NextResponse.json(
        { error: "Object storage is not configured. Set MINIO_ACCESS_KEY, MINIO_SECRET_KEY and MINIO_ENDPOINT to enable uploads." },
        { status: 501 }
      );
    }

    // Object key is derived from a pre-generated document id so bytes land in a
    // stable, private, server-auth'd path before the metadata row is written.
    const docId = crypto.randomUUID();
    const storageKey = objectKey(docId, 1, file.name);
    const buffer = new Uint8Array(await file.arrayBuffer());
    await uploadObject({ key: storageKey, body: buffer, contentType: file.type });

    // ---- PostgreSQL metadata + version record ----
    const parsedDoc = documentSchema.parse({
      title,
      description,
      category,
      projectId,
      classification,
      isVital,
      vitalCategory: vitalCategory || null,
    });

    const doc = await prisma.$transaction(async (tx) => {
      const created = await tx.document.create({
        data: {
          id: docId,
          title: parsedDoc.title,
          description: parsedDoc.description ?? null,
          category: parsedDoc.category ?? null,
          projectId: parsedDoc.projectId ?? null,
          uploaderId: session.user.id,
          storageKey,
          storageProvider: "minio",
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          classification: parsedDoc.classification,
          isVital: parsedDoc.isVital,
          vitalCategory: parsedDoc.vitalCategory ?? null,
          version: 1,
        },
      });
      await tx.documentVersion.create({
        data: {
          documentId: created.id,
          version: 1,
          storageKey,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          uploadedById: session.user.id,
        },
      });
      return created;
    });

    await audit.user(session.user, {
      action: "document.uploaded",
      resource: "Document",
      resourceId: doc.id,
      ipAddress: info.ipAddress,
      userAgent: info.userAgent,
      result: "success",
      metadata: { isVital: doc.isVital, classification: doc.classification, fileName: file.name },
    });

    return NextResponse.json(
      { ok: true, documentId: doc.id },
      { status: 201 }
    );
  } catch (e) {
    return toErrorResponse(e);
  }
}
