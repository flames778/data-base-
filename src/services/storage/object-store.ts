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

export interface StorageConfig {
  endpoint: string;
  region: string;
  accessKey: string;
  secretKey: string;
  bucket: string;
  forcePathStyle: boolean;
}

/**
 * S3-compatible object storage used for document file bytes.
 *
 * Works with any S3-compatible endpoint:
 *  - Development: MinIO (docker-compose) using MINIO_ENDPOINT=localhost.
 *  - Production: Cloudflare R2 or AWS S3. For R2 set MINIO_ENDPOINT to the
 *    full endpoint URL, e.g. `https://<account_id>.r2.cloudflarestorage.com`,
 *    MINIO_REGION=auto, MINIO_USE_SSL=true. Buckets are provisioned in the
 *    Cloudflare dashboard (R2 does not support auto-creating buckets over the
 *    S3 API), then referenced via MINIO_BUCKET.
 *
 * No matter the provider, the bucket and objects are private; every access is
 * authorized server-side and handed out as short-lived presigned URLs.
 *
 * Env vars read (all MINIO_* for backward compatibility, documented in
 * `.env.example`):
 *  - MINIO_ENDPOINT  full URL (contains `://`) OR hostname. Default: localhost
 *  - MINIO_PORT      only used when MINIO_ENDPOINT is a bare hostname
 *  - MINIO_USE_SSL   "true" to use https. Default: false
 *  - MINIO_REGION    "auto" for R2, us-east-1 for MinIO/local. Default: us-east-1
 *  - MINIO_ACCESS_KEY, MINIO_SECRET_KEY — required
 *  - MINIO_BUCKET    bucket name. Default: precpearl-private
 */
function getConfig(): StorageConfig {
  const host = env("MINIO_ENDPOINT", "localhost");
  const useSsl = process.env.MINIO_USE_SSL === "true";
  const port = process.env.MINIO_PORT ?? (useSsl ? "443" : "9000");
  const endpoint = host.includes("://")
    ? host
    : `${useSsl ? "https" : "http"}://${host}:${port}`;
  return {
    endpoint,
    region: process.env.MINIO_REGION ?? "us-east-1",
    accessKey: env("MINIO_ACCESS_KEY"),
    secretKey: env("MINIO_SECRET_KEY"),
    bucket: env("MINIO_BUCKET", "precpearl-private"),
    // R2 and MinIO both use path-style buckets; AWS S3 also accepts this.
    forcePathStyle: true,
  };
}

let client: S3Client | null = null;

function s3(): S3Client {
  if (client) return client;
  const { endpoint, region, accessKey, secretKey, forcePathStyle } = getConfig();
  client = new S3Client({
    region,
    endpoint,
    forcePathStyle,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  });
  return client;
}

/** True when object-storage environment configuration is present. */
export function isStorageConfigured(): boolean {
  return !!(
    process.env.MINIO_ACCESS_KEY &&
    process.env.MINIO_SECRET_KEY &&
    process.env.MINIO_ENDPOINT
  );
}

/** Human-readable provider label for ops/debugging (stored on Document rows). */
export function providerName(): string {
  const endpoint = getConfig().endpoint;
  if (endpoint.includes("r2.cloudflarestorage.com")) return "cloudflare-r2";
  if (endpoint.includes("://") && !endpoint.includes("localhost")) return "s3";
  return "minio";
}

/**
 * Ensure the configured private bucket exists (idempotent).
 *
 * MinIO supports creating buckets over the S3 API. Cloudflare R2 and AWS S3 do
 * not allow auto-provisioning buckets from the app (that's a console/CLI
 * operation), so a "create bucket" failure for a bucket that already exists is
 * treated as success — the caller is expected to pre-provision it.
 */
export async function ensureBucket(): Promise<void> {
  const { bucket, region } = getConfig();
  const s = s3();
  try {
    await s.send(new HeadBucketCommand({ Bucket: bucket }));
    return;
  } catch (err: unknown) {
    const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
    const status = e?.$metadata?.httpStatusCode;
    // Bucket exists (or we can reach it): nothing more to do.
    if (status !== undefined && status >= 200 && status < 300) return;
    // 404 / NoSuchBucket -> try to create it
    if (e?.name === "NotFound" || e?.name === "NoSuchBucket" || status === 404) {
      try {
        await s.send(
          new CreateBucketCommand({
            Bucket: bucket,
            ...(region !== "us-east-1" && region !== "auto"
              ? {
                  CreateBucketConfiguration: {
                    LocationConstraint: region as "eu-west-1",
                  },
                }
              : {}),
          })
        );
        return;
      } catch (createErr: unknown) {
        const ce = createErr as { name?: string };
        // Allow pre-provisioned buckets on providers that reject CreateBucket
        // (R2: BucketAlreadyOwnedByYou; S3: 409 BucketAlreadyOwnedByYou).
        if (
          ce?.name === "BucketAlreadyOwnedByYou" ||
          ce?.name === "BucketAlreadyExists" ||
          ce?.name === "Forbidden" ||
          (ce as { $metadata?: { httpStatusCode?: number } })?.$metadata
            ?.httpStatusCode === 409
        ) {
          return;
        }
        throw createErr;
      }
    }
    // Forbidden/access errors: bucket is assumed pre-provisioned elsewhere.
    if (e?.name === "Forbidden" || e?.name === "AccessDenied" || status === 403) {
      return;
    }
    throw err;
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