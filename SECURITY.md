# Security

## Authentication

- **Credentials (email + password)** via Auth.js/NextAuth v5 (`src/auth.ts`).
- Passwords are hashed with **bcrypt** (salt rounds 12) in
  `src/lib/passwords.ts`; plaintext is never stored or logged.
- A password policy enforces a minimum length (`MIN_PASSWORD_LENGTH = 8`).
- Sessions are **JWT**, stored in an `httpOnly` cookie. Identity and permissions
  are always derived server-side from the session/token — the frontend is never
  trusted.
- Disabled (`status = DISABLED`) users are rejected at sign-in and mid-session
  (their JWT identity/role/permissions are re-checked against the database at
  most once a minute; a disable or role change takes effect on the next
  check rather than only at the JWT's 30-day expiry).
- Sign-in is **rate-limited** (`src/lib/login-rate-limit.ts`): 5 failed
  attempts per email and 20 per source IP within a 15-minute window, tracked
  in the `login_attempts` table so it works correctly across multiple app
  instances. This is a baseline; add edge/CDN/WAF-level protection too if
  your deployment has one in front of it.
- `mustChangePassword` forces a password change on first sign-in and after
  admin-initiated resets.

## Password & account management

- Users change their own password via `changeOwnPassword` (current password
  verified first). An admin can create users, reset passwords, disable accounts,
  assign roles and manage team membership (`src/lib/actions/accounts.ts`).
- Temporary passwords are returned **once** to the administrator for secure
  manual delivery; they are never re-readable afterward.
- Sensitive account actions are **audited** (create, disable, password reset,
  password change, team changes).

## Authorization (RBAC)

- Central permission registry: `src/lib/permissions.ts`.
- Server-side guards: `requireAuth()` / `requirePermission()` in `src/lib/authz.ts`.
- `src/proxy.ts` is an edge middleware that only improves UX (early redirects,
  password-change gate). **It is not the security boundary** — every page, API
  route and server action enforces authorization server-side.

## Object storage (S3-compatible: R2 / MinIO)

- Files are stored only in a **private** bucket (e.g. `precpearl-private`).
- Bucket/object access is **server-side authorized** before any upload or
  download; there is no public read access to the bucket.
- Downloads use **temporary presigned URLs** (5-minute expiry).
- Upload validation: allowed MIME types + extensions, maximum file size (25 MB),
  empty-file rejection.
- Provider credentials (R2 API tokens, MinIO keys) are server-only env vars;
  they are never exposed to the browser.

## Audit

- `src/lib/audit.ts` writes an **append-only** `AuditLog` (action, resource,
  actor, IP, user agent, result, metadata) for security-relevant events.
- Only users with the `audit.view` permission can read the log.

## Headers & config

`next.config.ts` adds security headers (X-Frame-Options, nosniff,
Referrer-Policy, Permissions-Policy, CSP baseline, HSTS in production) and uses
`reactStrictMode`.
