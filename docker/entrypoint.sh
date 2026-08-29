#!/bin/sh
set -e

# Apply any pending schema migrations (append-only; safe to run on every start).
# Non-interactive and idempotent. Optional: disable with SKIP_MIGRATIONS=1.
if [ "${SKIP_MIGRATIONS:-0}" != "1" ]; then
  echo "Applying database migrations..."
  npx prisma migrate deploy
fi

# Boot the standalone Next.js server.
echo "Starting Prec Pearl..."
exec "$@"
