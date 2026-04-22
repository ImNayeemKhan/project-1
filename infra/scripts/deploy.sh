#!/usr/bin/env bash
# Pull latest code + rebuild & restart containers with zero-downtime.
# Run as the deploy user on the VPS.
set -euo pipefail

cd "$(dirname "$0")/../.."
git pull --ff-only
docker compose -f infra/docker-compose.yml build
docker compose -f infra/docker-compose.yml up -d --remove-orphans
docker compose -f infra/docker-compose.yml exec -T api node dist/scripts/seed.js || true
echo "Deploy complete."
