# Architecture

Prec Pearl is a Next.js 16 (App Router) application with a PostgreSQL backend
and S3-compatible object storage (MinIO in development, Cloudflare R2 in
production).

## High-level flow

```
Browser ──► Next.js (App Router)
              │  Auth.js (NextAuth) ──► PostgreSQL (users, roles, sessions)
              │
              ├─ server actions / route handlers
              │     └─ requireAuth() / requirePermission()   (RBAC)
              │     └─ audit.record()                         (audit trail)
              │
              ├─ PostgreSQL  ── metadata, RBAC, reports, docs, claims, etc.
              └─ S3 bucket (R2/MinIO) ── document file bytes (private bucket)
```

## Authentication

- First-party **credentials** (email + password) via the Auth.js `Credentials`
  provider.
- Passwords are hashed with **bcrypt** (`src/lib/passwords.ts`) and stored only
  as hashes in PostgreSQL. They are never stored or transmitted in plaintext.
- Sessions are **JWT-based**, stored in an `httpOnly` cookie
  (`authjs.session-token`).
- On every new session, role and permissions are loaded fresh from the database
  and embedded in the JWT. Identity is **never trusted from the frontend**.
- A `mustChangePassword` flag forces users to set a new password at first sign-in
  (used by newly created and password-reset accounts).

See `SECURITY.md` for the detailed security model.

## Authorization (RBAC)

- `src/lib/permissions.ts` is the **single source of truth** for permission keys
  and role→permission mappings (`ROLE_PERMISSIONS`).
- `src/lib/authz.ts` provides `requireAuth()`, `requirePermission()` and the
  related error types used throughout server actions/pages/APIs.
- Roles are seeded from that registry into PostgreSQL (see `prisma/seed.ts`).

## Object storage (documents)

- **PostgreSQL** stores document metadata, versions and access-control rules.
- A **private S3-compatible bucket** (MinIO in development, Cloudflare R2 in
  production) stores the actual file bytes.
- All uploads/downloads are **server-side authorized** first; downloads use
  short-lived **presigned URLs** (default 5-minute expiry).
- File type and size validation happen in the upload route
  (`src/app/api/documents/upload/route.ts`).

See `src/services/storage/object-store.ts`.

## Key directories

- `src/lib/` — permissions, authz, passwords, audit, validation, server actions
- `src/services/` — domain logic (documents, reports, issues, claims, search, storage)
- `src/auth.ts` — NextAuth configuration
- `src/proxy.ts` — edge middleware (UX-only redirects; not the security boundary)
- `prisma/` — schema, migrations, seed
- `docker-compose.yml` — PostgreSQL + MinIO for local development
