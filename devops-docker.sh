#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

echo "==> Deploying PECAT-E (Docker) from ${ROOT}"

if [[ ! -f .env ]]; then
  echo "ERROR: .env not found. Copy env.example to .env and configure production values."
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "ERROR: docker compose is not available on this host."
  exit 1
fi

echo "==> Pulling latest code..."
git pull --ff-only

echo "==> Building images..."
# NEXT_PUBLIC_* args are baked into the client bundle at build time, so a
# rebuild is required whenever they change (docker-compose.yml forwards them).
docker compose build

echo "==> Starting containers..."
# The app container applies prisma migrate deploy on start (see Dockerfile CMD)
# before serving, so no separate migration step is needed here.
docker compose up -d

echo "==> Waiting for the app to answer on :3000..."
for i in $(seq 1 60); do
  if curl -fsS -o /dev/null http://localhost:3000; then
    echo "==> App is up."
    break
  fi
  if [[ "$i" -eq 60 ]]; then
    echo "ERROR: app did not answer after 120s. Recent logs:"
    docker compose logs --tail=50 app
    exit 1
  fi
  sleep 2
done

echo "==> Pruning dangling images from previous builds..."
docker image prune -f >/dev/null

echo "==> Deployment complete."
docker compose ps
docker compose logs --tail=20 app
