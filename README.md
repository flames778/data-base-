# Prec Pearl — Internal Operations & Records Management Platform

A production-oriented web platform for Prec Pearl Limited covering internal
operations, reporting, records management, RBAC, document management, a staff
hub, claims/issues, audit logging, notifications and search.

## Tech stack

- **Next.js 16** (App Router, Turbopack), **React 19**, **Tailwind CSS v4**
- **TypeScript** (strict)
- **PostgreSQL 16** via **Prisma 6**
- **Auth.js / NextAuth v5** — first-party credential (email + password) auth,
  JWT sessions, bcrypt password hashing
- **MinIO** — S3-compatible object storage for document file bytes
- **Vitest** for unit tests

## Getting started (local development)

Requires **Docker** (for PostgreSQL + MinIO) and **Node 20+**.

```bash
# 1. Install dependencies
npm install

# 2. Copy example env and set values
cp .env.example .env

# 3. Start PostgreSQL + MinIO
docker compose up -d

# 4. Apply database migrations
npx prisma migrate deploy

# 5. Seed system config + development bootstrap accounts
#    (options: npx tsx prisma/seed.ts or npm run db:seed)
npm run db:seed

# 6. Run the app
npm run dev
```

Open http://localhost:3000 and sign in with a development bootstrap account.

## Development bootstrap accounts (DEV ONLY)

Seeding creates four **temporary** accounts (only when `NODE_ENV !==
"production"` and `SEED_DEV_ACCOUNTS !== "false"`):

| Role          | Email                     |
|---------------|---------------------------|
| CEO           | `ceo@precpearl.local`     |
| Admin         | `admin@precpearl.local`   |
| Project Lead  | `projectlead@precpearl.local` |
| Team Member   | `teammember@precpearl.local`  |

Passwords are read from `SEED_*_PASSWORD` environment variables, or — if unset —
a random temporary password is generated and printed once to the console (the
account is then flagged `mustChangePassword`). **These credentials are for local
development only and must be changed immediately.** Each bootstrap account with
a generated password is forced to set a new password at first sign-in.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build + typecheck
- `npm run lint` — ESLint
- `npm run test` / `npx vitest run` — unit tests
- `npm run db:seed` — seed system config + dev bootstrap accounts
- `npx prisma migrate dev` — create/apply migrations (interactive)

## Environment

See `.env.example` for the full list, including MinIO credentials and the
optional seed password variables. Never commit real secrets.

## Documentation

- `ARCHITECTURE.md` — system design, security model, auth & storage flow
- `DATABASE.md` — schema overview and data model
- `SECURITY.md` — auth, passwords, RBAC, audit and object storage security
- `DEPLOYMENT.md` — building and deploying with Docker
