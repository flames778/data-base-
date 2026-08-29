import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  ListBucketsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function env(name: string, fallback?: string): string {
  const value = process.env[name];
  if (value && value.length > 0) return value;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing required environment variable: ${name}`);
}

/**
 * S3-compatible object storage (MinIO in development, any S3 endpoint in prod).
 * Bucket and objects are private; all access is server-side authorized and
 * handed out as short-lived presigned URLs.
 */
function getConfig() {
  const useSsl = process.env.MINIO_USE_SSL === "true";
  const host = env("MINIO_ENDPOINT", "localhost");
  const port = process.env.MINIO_PORT ?? "9000";
  return {
    endpoint: `${useSsl ? "https" : "http"}://${host}:${port}`,
    region: process.env.MINIO_REGION ?? "us-east-1",
    accessKey: env("MINIO_ACCESS_KEY"),
    secretKey: env("MINIO_SECRET_KEY"),
    bucket: env("MINIO_BUCKET", "precpearl-private"),
  };
}

let client: S3Client | null = null;

function s3(): S3Client {
  if (client) return client;
  const { endpoint, region, accessKey, secretKey } = getConfig();
  client = new S3Client({
    region,
    endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  });
  return client;
}

/** True when MinIO environment configuration is present. */
export function isStorageConfigured(): boolean {
  return !!(process.env.MINIO_ACCESS_KEY && process.env.MINIO_SECRET_KEY && process.env.MINIO_ENDPOINT);
}

/** Ensure the configured private bucket exists (idempotent). */
export async function ensureBucket(): Promise<void> {
  const { bucket, region } = getConfig();
  const s = s3();
  try {
    await s.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch (err: unknown) {
    const e = err as { name?: string };
    // 404 / NoSuchBucket -> create it
    if (e?.name === "NotFound" || e?.name === "NoSuchBucket" || e?.name === "404") {
      await s.send(
        new CreateBucketCommand({
          Bucket: bucket,
          ...(region !== "us-east-1"
            ? {
                CreateBucketConfiguration: {
                  LocationConstraint: region as "eu-west-1",
                },
              }
            : {}),
        })
      );
    } else {
      throw err;
    }
  }
}

/** Full object key for a document version stored in the private bucket. */
export function objectKey(documentId: string, version: number, fileName: string): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `documents/${documentId}/v${version}/${safeName}`;
}

export interface StorageUploadInput {
  key: string;
  body: Uint8Array | Buffer;
  contentType: string;
}

/** Upload bytes into the private bucket. */
export async function uploadObject(input: StorageUploadInput): Promise<void> {
  const { bucket } = getConfig();
  await s3().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
    })
  );
}

/** Generate a short-lived presigned GET URL for an authorized object. */
export async function getPresignedDownloadUrl(key: string, expiresInSeconds = 300): Promise<string> {
  const { bucket } = getConfig();
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(s3(), command, { expiresIn: expiresInSeconds });
}

/** Delete an object from the private bucket. */
export async function deleteObject(key: string): Promise<void> {
  const { bucket } = getConfig();
  await s3().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

/** Verify connectivity by listing buckets (used by a health check). */
export async function ping(): Promise<boolean> {
  const res = await s3().send(new ListBucketsCommand({}));
  return Array.isArray(res.Buckets);
}
