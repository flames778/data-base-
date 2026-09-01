# Deployment

Recommended production topology:

- **App** — hosted on **Vercel** (Next.js serverless), via GitHub integration.
- **Database** — **Supabase** PostgreSQL (transaction pooler for the app,
  direct connection for migrations).
- **File storage** — **Cloudflare R2** (S3-compatible private bucket;
  downloads go through short-lived presigned URLs generated server-side).
- **Email** — any SMTP provider (used for password-reset emails).
- **CI** — GitHub Actions (tests) + a migration workflow that applies schema
  changes to production on every merge to `main`.

## Vercel + Supabase + Cloudflare R2

### 1. Set up Supabase (Postgres)

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **Project Settings → Database → Connection string**.
3. Copy the **Transaction pooler** URI (port `6543`) → this is your
   `DATABASE_URL`. Make sure `?pgbouncer=true` is present (Prisma uses it to
   select the PgBouncer-compatible driver mode for serverless apps).
4. Copy the **Direct connection** URI (port `5432`) → this is your
   `DIRECT_URL`. Migrations require the direct connection because
   PgBouncer's transaction pooler doesn't support the session-mode features
   `prisma migrate deploy` uses.
5. If you need to run the initial migration before the first CI run:
   ```bash
   DATABASE_URL="<pooler-url>" DIRECT_URL="<direct-url>" npx prisma migrate deploy
   ```

### 2. Set up Cloudflare R2 (object storage)

The app stores document file bytes in any S3-compatible bucket using the AWS
S3 SDK. R2 is a drop-in:

1. In Cloudflare, create an R2 **bucket** (e.g. `precpearl-private`).
   **Create the bucket yourself** — R2 does not allow the app to auto-create
   buckets over the S3 API.
2. Go to **R2 → Manage R2 API Tokens** and create a token with **Object Read &
   Write** scoped to that bucket. Note the **Access Key ID** and **Secret
   Access Key**.
3. Set these env vars (the storage layer reads `MINIO_*` names for backward
   compatibility, but accepts R2 values):

   - `MINIO_ENDPOINT` → `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
   - `MINIO_PORT` → `443`
   - `MINIO_USE_SSL` → `true`
   - `MINIO_REGION` → `auto`
   - `MINIO_ACCESS_KEY` → your R2 Access Key ID
   - `MINIO_SECRET_KEY` → your R2 Secret Access Key
   - `MINIO_BUCKET` → the bucket you created

   AWS S3 works identically (`MINIO_REGION` = your bucket region; the bucket
   must also be pre-created). MinIO is only used for local development.

### 3. Deploy to Vercel

1. Push the repo to GitHub (the repo already includes `vercel.json`, which
   sets `framework: nextjs` and the build command `prisma generate && next
   build`).
2. Import the repo at [vercel.com/new](https://vercel.com/new). Vercel
   auto-detects Next.js. Set `NODE_ENV` is managed by Vercel.
3. Under **Project → Settings → Environment Variables**, set (production, and
   preview if you want it to point at a non-prod setup):

   - `DATABASE_URL` — Supabase pooled URL (port `6543`, `?pgbouncer=true`).
   - `DIRECT_URL` — Supabase direct URL (port `5432`).
   - `AUTH_SECRET` — generate with `openssl rand -base64 32`.
   - `NEXTAUTH_URL` — your Vercel production URL (e.g. `https://precpearl.vercel.app`).
     Also set `APP_BASE_URL` to the same value (used to build absolute links
     in emails).
   - The `MINIO_*` R2 values from step 2.
   - `SEED_DEV_ACCOUNTS=false`. (The seed also hard-refuses to create dev
     accounts when `NODE_ENV=production`, which Vercel sets automatically —
     this is belt-and-suspenders.)
   - Optional: `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN` to enable error
     reporting.
4. Deploy. Vercel runs `npm install` (the `postinstall` runs `prisma
   generate`) then the `buildCommand` from `vercel.json`
   (`prisma generate && next build`). Runtime functions use the **Node.js**
   runtime (all routes that need bcrypt, Prisma, nodemailer, or the S3 SDK are
   `export const runtime = "nodejs"`).

### 4. Production migrations

Vercel does **not** run database migrations. Schema changes are applied by
the GitHub Actions workflow `.github/workflows/migrate.yml`, which runs
`npx prisma migrate deploy` against production on every push to `main`.

Set these GitHub repository secrets (Settings → Secrets and variables →
Actions):

- `PROD_DATABASE_URL` — Supabase pooled URL (same as Vercel's `DATABASE_URL`).
- `PROD_DIRECT_URL` — Supabase direct URL (same as Vercel's `DIRECT_URL`).
- `PROD_AUTH_SECRET` — same value as Vercel's `AUTH_SECRET`.

With this in place, every merge to `main` that includes a schema change is
migrated before the Vercel production build finishes, so the new server code
never runs against an un-migrated schema.

### 5. Runtime limits to know

- **Upload size**: the upload route buffers the file in memory before writing
  to R2 and enforces `MAX_FILE_SIZE = 25 MB`. Vercel's serverless functions
  cap incoming request bodies (Hobby ≈ 4.5 MB; Pro higher). Stay within the
  platform cap, or (later) switch uploads to browser→R2 **presigned PUT** for
  large files.
- **Function duration**: default `maxDuration` is fine for this workload.
- **Emails**: password-reset emails go out over SMTP from the server; your
  SMTP provider must be reachable from Vercel's network. If SMTP is
  unconfigured, the app degrades gracefully (reset flow works only when SMTP
  is present).
- **Secrets**: rotate `AUTH_SECRET` and R2 keys if they ever leak. Vercel
  encrypts env vars at rest; never put them in `.env` committed to git.

---

## Self-hosted (Docker)

The project also produces a **standalone** Next.js output for containerized
deployment (`output: "standalone"` is enabled when
`NEXT_OUTPUT_STANDALONE=1`; the `Dockerfile` sets this in its builder stage).

### Prerequisites

- **PostgreSQL** (>= 14)
- **MinIO** (local dev) or any S3-compatible endpoint for document storage
- A strong `AUTH_SECRET` (64+ random chars): `openssl rand -base64 32`

### Environment

Set all values in `.env` (see `.env.example`):

- `DATABASE_URL`, `DIRECT_URL` — PostgreSQL DSNs. For a non-pooled setup
  (e.g. the bundled `docker-compose.yml` Postgres), set both to the same
  value.
- `NEXTAUTH_URL`, `AUTH_SECRET`
- Storage: `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL`, `MINIO_REGION`,
  `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`

**In production, `NODE_ENV=production`, set `SEED_DEV_ACCOUNTS=false` and leave
the `SEED_*_PASSWORD` variables empty.** The seed will never create development
bootstrap accounts in production.

### Build & run

```bash
npm ci
npm run build
npx prisma migrate deploy
npm run db:seed          # optional; system config only in production
npm start
```

The app listens on port `3000` by default (`PORT` env to change).

### Docker image

```bash
docker build -t precpearl .
docker run --env-file .env -p 3000:3000 precpearl
```

The multi-stage `Dockerfile` copies `.next/standalone`, `public`, the Prisma
CLI/client (so migrations can run at container start), and boots via
`docker/entrypoint.sh`, which runs `npx prisma migrate deploy` (unless
`SKIP_MIGRATIONS=1`) and then `node server.js`. PostgreSQL + MinIO for local
development are defined in `docker-compose.yml`.

## Reverse proxy

Terminate TLS at a reverse proxy (nginx/Caddy) and forward to the app. Because
`src/proxy.ts` (middleware) is UX-only, no special proxy configuration is
required for security; keep the whole site behind HTTPS.

## Continuous integration

`.github/workflows/ci.yml` runs lint, typecheck, tests, and a production
build against a throwaway Postgres service container on every push and pull
request to `main`. It uses CI-only database and dummy secrets — it never
touches the real Supabase/production database.

`.github/workflows/migrate.yml` applies production migrations on merge to
`main` (see section 4 above).

## Error monitoring (optional)

Set `NEXT_PUBLIC_SENTRY_DSN` and `SENTRY_DSN` (get these from a project at
[sentry.io](https://sentry.io)) to enable error reporting; leave them unset
to run without Sentry. Client-side events are tunneled through this app's own
`/monitoring` route rather than sent directly to Sentry, so no
Content-Security-Policy changes are needed and ad-blockers won't interfere.

## Verification before release

Run the full checks:

```bash
npm run lint
npx tsc --noEmit
npx vitest run
npx prisma migrate deploy
npm run build
```