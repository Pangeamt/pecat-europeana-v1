#!/usr/bin/env bash
set -euo pipefail

# Deploys PECAT-E from the image published in ECR. Nothing is built on this
# host: the image comes from devops-build-push.sh, run wherever there is room
# to build.
#
#   ./devops-docker.sh            # deploys :latest
#   ./devops-docker.sh b91102a    # deploys that commit (also the way to roll back)
#
# The host must be logged in to ECR (the token lasts 12 h):
#   aws ecr get-login-password --region eu-west-1 | \
#     docker login --username AWS --password-stdin 566308635108.dkr.ecr.eu-west-1.amazonaws.com

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

export PECAT_IMAGE_TAG="${1:-${PECAT_IMAGE_TAG:-latest}}"

echo "==> Deploying PECAT-E (Docker, image tag ${PECAT_IMAGE_TAG}) from ${ROOT}"

if [[ ! -f .env ]]; then
  echo "ERROR: .env not found. Copy env.example to .env and configure production values."
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "ERROR: docker compose is not available on this host."
  exit 1
fi

echo "==> Pulling latest code (compose file and scripts)..."
git pull --ff-only

echo "==> Pulling the image from ECR..."
if ! docker compose pull app; then
  echo "ERROR: could not pull the image. Is this host logged in to ECR, and does the tag ${PECAT_IMAGE_TAG} exist?"
  exit 1
fi

echo "==> Starting containers..."
# The app container applies prisma migrate deploy on start (see Dockerfile CMD)
# before serving, so no separate migration step is needed here.
docker compose up -d --no-build

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

echo "==> Pruning dangling images left by previous versions..."
docker image prune -f >/dev/null

echo "==> Deployment complete."
docker compose ps
docker compose logs --tail=20 app
