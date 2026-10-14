#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

echo "==> Deploying PECAT-E from ${ROOT}"

if [[ ! -f .env ]]; then
  echo "ERROR: .env not found. Copy env.example to .env and configure production values."
  exit 1
fi

echo "==> Pulling latest code..."
git pull --ff-only

echo "==> Installing dependencies..."
pnpm install

echo "==> Generating Prisma client..."
pnpm exec prisma generate --schema=./prisma/schema.prisma

echo "==> Running database migrations..."
pnpm exec prisma migrate deploy --schema=./prisma/schema.prisma

echo "==> Ensuring upload directory..."
# Uploaded originals live in uploads/, outside public/ (lib/uploads.js). Files
# left in public/files by an older version are moved there (never overwritten);
# their database paths keep working.
mkdir -p uploads
if [ -d public/files ]; then
  find public/files -maxdepth 1 -type f -exec mv -n {} uploads/ \;
fi
chmod -R 755 uploads 2>/dev/null || true

echo "==> Building application..."
pnpm build

echo "==> Restarting application with PM2..."
pm2 startOrRestart ecosystem.config.cjs --update-env

echo "==> Deployment complete."
pm2 status pecat-e
