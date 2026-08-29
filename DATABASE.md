# Database

PostgreSQL 16 via Prisma 6. Migrations live in `prisma/migrations/`.

## Datasource

```
DATABASE_URL="postgresql://precpearl:precpearl_dev@localhost:5433/precpearl?schema=public"
```

Matches `docker-compose.yml` (host port `5433`, container port `5432`).

## Core models

- **User** — email (unique), bcrypt `passwordHash`, role, status, timestamps;
  password-reset fields (`passwordResetToken`, `passwordResetExpiresAt`) and
  `mustChangePassword`. Replaced the former `entraId` (Microsoft identity).
- **Role / Permission / RolePermission** — RBAC catalog and mappings.
- **Team / UserTeamMembership** — teams and memberships.
- **Project / ProjectMember** — projects, leads, members.
- **ReportTemplate / ReportField / Report / ReportFieldValue / ReportStatusHistory** —
  report templates, submissions, fields and status transitions.
- **Document / DocumentVersion / DocumentAccessRule** — document metadata,
  versions and CRUD-level access rules. File bytes live in MinIO, referenced by
  `Document.storageKey` / `DocumentVersion.storageKey` (replaced the former
  SharePoint columns).
- **Issue / Claim / ForumPost / Comment** — staff-hub content.
- **AuditLog** — append-only audit trail.
- **Notification** — in-app notifications.

## Migrations

- `20260827174926_init` — initial schema.
- `20260827180728_add_post_project_relation` — added ForumPost↔Project relation.
- `20260827201614_credentials_auth_and_minio_storage` — added `User` password
  fields (replacing `entraId`), added `Document`/`DocumentVersion` storage key
  columns (replacing SharePoint), added `passwordResetToken` unique index.

## Apply / evolve

```bash
npx prisma migrate deploy   # apply applied migrations (safe, non-interactive)
npx prisma migrate dev      # create new migrations (interactive, local)
npx prisma generate         # regenerate the client after schema changes
```

## Seeding

`prisma/seed.ts` seeds only system configuration (permissions, roles,
role–permission mappings, and the base report templates) plus optional
development bootstrap accounts. It creates **no mock operational data**.

- Development bootstrap accounts are created only when `NODE_ENV !==
  "production"` and `SEED_DEV_ACCOUNTS !== "false"`. Passwords come from
  `SEED_*_PASSWORD` env vars or are auto-generated and logged once.
- If the database is otherwise empty, pages render proper **empty states**
  rather than fabricated data.
