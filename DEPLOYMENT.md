# Deployment

The project builds a **standalone** Next.js output (`output: "standalone"`),
making it easy to run in a container behind a reverse proxy.

## Prerequisites

- **PostgreSQL** (>= 14)
- **MinIO** (or any S3-compatible endpoint) for document storage
- A strong `NEXTAUTH_SECRET` (64+ random chars): `openssl rand -base64 32`

## Environment

Set all values in `.env` (see `.env.example`):

- `DATABASE_URL` — PostgreSQL DSN
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- MinIO: `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL`, `MINIO_REGION`,
  `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`

**In production, `NODE_ENV=production`, set `SEED_DEV_ACCOUNTS=false` and leave
the `SEED_*_PASSWORD` variables empty.** The seed will never create development
bootstrap accounts in production.

## Build & run

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

## Verification before release

Run the full checks:

```bash
npm run lint
npx vitest run
npx prisma migrate deploy
npm run build
```
