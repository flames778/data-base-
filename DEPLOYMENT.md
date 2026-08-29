# Deployment

## Vercel + Supabase (recommended)

### 1. Set up Supabase (Postgres)

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **Project Settings → Database → Connection string**.
3. Copy the **Transaction pooler** URI (port `6543`) → this is your
   `DATABASE_URL`. Append `?pgbouncer=true` if it isn't already there.
4. Copy the **Direct connection** URI (port `5432`) → this is your
   `DIRECT_URL`. Migrations need this because PgBouncer's transaction pooler
   doesn't support the session-mode features `prisma migrate deploy` uses.
5. Run migrations once, from your machine, pointed at Supabase:
   ```bash
   DATABASE_URL="<pooler-url>" DIRECT_URL="<direct-url>" npx prisma migrate deploy
   ```

### 2. Set up object storage

Supabase's own Storage is not S3-compatible in the way this app's MinIO
client expects. Simplest options:
- **Cloudflare R2** (S3-compatible, generous free tier) — get
  `MINIO_ENDPOINT` (e.g. `<account_id>.r2.cloudflarestorage.com`),
  `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` from R2's dashboard. Set
  `MINIO_USE_SSL=true`, `MINIO_PORT=443`.
- **AWS S3** works the same way — this app talks to any S3-compatible API.

### 3. Deploy to Vercel

1. Import the GitHub repo at [vercel.com/new](https://vercel.com/new).
2. Under **Environment Variables**, add everything from `.env.example`
   with real values — at minimum: `DATABASE_URL`, `DIRECT_URL`,
   `AUTH_SECRET` (generate with `openssl rand -base64 32`), `NEXTAUTH_URL`
   (your Vercel production URL), and the `MINIO_*` storage vars.
   Add Sentry's `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_DSN` if you're using it.
3. Deploy. Vercel runs `npm install` (which triggers `prisma generate` via
   the `postinstall` script) then `npm run build` automatically.
4. Migrations are **not** run automatically on Vercel (its serverless build
   environment isn't meant for long-running migration commands against a
   pooled connection). Run `npx prisma migrate deploy` yourself — locally
   with the production `DATABASE_URL`/`DIRECT_URL`, or from a one-off CI
   step — after every deploy that includes a schema change.
5. Set `SEED_DEV_ACCOUNTS=false` in the Vercel production environment (the
   seed script also hard-refuses to run when `NODE_ENV=production`, which
   Vercel sets automatically, so this is a belt-and-suspenders setting).

---

## Self-hosted (Docker)

The project also builds a **standalone** Next.js output (`output:
"standalone"`), making it easy to run in a container behind a reverse proxy
instead of Vercel.

### Prerequisites

- **PostgreSQL** (>= 14)
- **MinIO** (or any S3-compatible endpoint) for document storage
- A strong `AUTH_SECRET` (64+ random chars): `openssl rand -base64 32`

### Environment

Set all values in `.env` (see `.env.example`):

- `DATABASE_URL`, `DIRECT_URL` — PostgreSQL DSNs. For a non-pooled setup
  (e.g. the bundled `docker-compose.yml` Postgres), set both to the same
  value.
- `NEXTAUTH_URL`, `AUTH_SECRET`
- MinIO: `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL`, `MINIO_REGION`,
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

The `.next/standalone` directory contains a self-contained server:

```bash
docker build -t precpearl .
docker run --env-file .env -p 3000:3000 precpearl
```

Provide a `Dockerfile` that copies `.next/standalone`, `public` and
`node_modules` (only if not bundled), then runs `node server.js`. The MinIO and
PostgreSQL services for local development are defined in `docker-compose.yml`.

## Reverse proxy

Terminate TLS at a reverse proxy (nginx/Caddy) and forward to the app. Because
`proxy.ts` (middleware) is UX-only, no special proxy configuration is required
for security; keep the whole site behind HTTPS.

## Continuous integration

`.github/workflows/ci.yml` runs lint, typecheck, tests, and a production
build against a throwaway Postgres service container on every push and pull
request to `main`. It uses its own CI-only database and dummy secrets — it
never touches your real Supabase/production database.

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

