#!/usr/bin/env bash
set -euo pipefail

# Builds the production image of PECAT-E from the commit checked out here and
# publishes it in ECR as <short commit> and latest. Production (vssrv05) only
# pulls it (devops-docker.sh); run this on a host with room to build.
#
#   PUBLIC_URL=https://ai4cpecat.pangeanic.com ./devops-build-push.sh
#
# PUBLIC_URL is baked into the client bundle (NEXT_PUBLIC_API_BASE_URL and
# NEXTAUTH_URL), so an image is only good for the site it was built for.
# The host must be logged in to ECR (see devops-docker.sh).

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

IMAGE="${PECAT_IMAGE:-566308635108.dkr.ecr.eu-west-1.amazonaws.com/pecat-europeana-v1}"
PUBLIC_URL="${PUBLIC_URL:?set PUBLIC_URL to the public address of the site, e.g. https://ai4cpecat.pangeanic.com}"
COMMIT="$(git rev-parse --short HEAD)"

if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  echo "ERROR: the working tree has uncommitted changes; the image would not match ${COMMIT}."
  exit 1
fi

echo "==> Building ${IMAGE}:${COMMIT} for ${PUBLIC_URL}"
docker build \
  --build-arg "NEXT_PUBLIC_API_BASE_URL=${PUBLIC_URL}" \
  --build-arg "NEXTAUTH_URL=${PUBLIC_URL}" \
  -t "${IMAGE}:${COMMIT}" \
  -t "${IMAGE}:latest" \
  .

echo "==> Pushing ${IMAGE}:${COMMIT} and :latest"
docker push "${IMAGE}:${COMMIT}"
docker push "${IMAGE}:latest"

echo "==> Published. Deploy with: ./devops-docker.sh ${COMMIT}"
