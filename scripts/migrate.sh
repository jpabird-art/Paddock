#!/bin/sh
# Applies pending migrations before the server starts.
#
# A marketing deployment owns no data, so it has no DATABASE_URL and nothing
# to migrate. Skipping keeps that service from crash-looping on a Prisma
# schema validation error at boot.
set -e

if [ "$PADDOCK_SITE_MODE" = "marketing" ]; then
  echo "==> Marketing mode: no database, skipping migrations."
  exit 0
fi

if [ -z "$DATABASE_URL" ]; then
  echo "==> DATABASE_URL is not set. A tenant deployment needs one." >&2
  exit 1
fi

echo "==> Applying database migrations..."
if [ -f node_modules/prisma/build/index.js ]; then
  # Standalone production image: the Prisma CLI is present but npx is not.
  node node_modules/prisma/build/index.js migrate deploy
else
  npx prisma migrate deploy
fi
