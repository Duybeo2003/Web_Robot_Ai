#!/usr/bin/env bash
# Deploys the latest main branch to this server.
# Run from the repo root on the server (where docker-compose.yml + .env live):
#   bash scripts/deploy.sh
set -Eeuo pipefail

if [ ! -f docker-compose.yml ] || [ ! -f .env ]; then
  echo "Run this from the repo root (docker-compose.yml / .env not found here)." >&2
  exit 1
fi

echo "==> Pulling latest main..."
git pull --ff-only origin main

SHA="$(git rev-parse HEAD)"
IMAGE_BASE="$(grep '^ROBOEQ_IMAGE=' .env | head -1 | cut -d= -f2- | cut -d: -f1 || true)"
IMAGE_BASE="${IMAGE_BASE:-nguyenduy203/web-robot-ai}"
NEW_IMAGE="${IMAGE_BASE}:${SHA}"

echo "==> Checking that ${NEW_IMAGE} exists on Docker Hub..."
if ! curl -sf -o /dev/null "https://hub.docker.com/v2/repositories/${IMAGE_BASE}/tags/${SHA}/"; then
  echo "Image tag ${SHA} isn't on Docker Hub yet." >&2
  echo "CI (Docker Build and Push) probably hasn't finished for this commit — check:" >&2
  echo "  https://github.com/Duybeo2003/Web_Robot_Ai/actions" >&2
  echo ".env was left untouched; re-run this script once that workflow is green." >&2
  exit 1
fi

cp .env ".env.bak.$(date -u +%Y%m%dT%H%M%SZ)"
sed -i "s|^ROBOEQ_IMAGE=.*|ROBOEQ_IMAGE=${NEW_IMAGE}|" .env
echo "==> Deploying ${NEW_IMAGE}"

docker compose pull web
docker compose up -d web

echo "==> Applying any pending schema changes..."
# No --accept-data-loss: if a future change would actually drop/truncate data,
# prisma prompts for confirmation. Run this script from an interactive SSH
# session (not a non-interactive pipeline) so that prompt is visible and you
# can decide, rather than something silently auto-accepting data loss.
docker compose exec web npx prisma db push

echo "==> Waiting for the app to report healthy..."
for _ in $(seq 1 15); do
  if curl -sf http://localhost:3000/api/health | grep -q '"status":"ok"'; then
    echo "==> Deploy complete: ${NEW_IMAGE}"
    exit 0
  fi
  sleep 2
done

echo "Container is up but /api/health isn't reporting ok yet — check logs:" >&2
echo "  docker compose logs -f web" >&2
exit 1
