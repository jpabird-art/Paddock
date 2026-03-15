#!/bin/sh
set -e

echo "==> Running database migrations..."
npx prisma migrate deploy

echo "==> Checking if database needs seeding..."
USER_COUNT=$(node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.count().then(n => { console.log(n); p.\$disconnect(); });
")

if [ "$USER_COUNT" = "0" ]; then
  echo "==> Seeding database with demo data..."
  npm run prisma:seed
else
  echo "==> Database already has data, skipping seed."
fi

echo "==> Starting HCMR Fleet..."
exec npm start
