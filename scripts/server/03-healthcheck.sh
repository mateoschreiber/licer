#!/usr/bin/env bash
set -euo pipefail
docker compose --env-file .env.production ps
curl -fsS http://localhost:8088/api/v1/health
echo
curl -fsSI http://localhost:8088 | head -n 1
docker compose --env-file .env.production logs --tail=100 backend
docker compose --env-file .env.production logs --tail=100 nginx
