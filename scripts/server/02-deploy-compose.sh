#!/usr/bin/env bash
set -euo pipefail
REPO_URL="${REPO_URL:-https://github.com/mateoschreiber/licer.git}"
BRANCH="${BRANCH:-main}"
TARGET_PATH="${TARGET_PATH:-/opt/licitaciones}"
SEED_DEMO="${SEED_DEMO:-false}"
info() { echo "==> $*"; }
fail() { echo "ERROR: $*" >&2; exit 1; }
set_env() {
  local key="$1" value="$2"
  if grep -q "^${key}=" .env.production; then
    sed -i "s|^${key}=.*|${key}=${value}|" .env.production
  else
    printf '%s=%s\n' "${key}" "${value}" >> .env.production
  fi
}
env_value() { grep "^$1=" .env.production | tail -n 1 | cut -d= -f2-; }
if [ ! -d "${TARGET_PATH}/.git" ]; then
  git clone --branch "${BRANCH}" "${REPO_URL}" "${TARGET_PATH}"
fi
cd "${TARGET_PATH}"
git fetch origin "${BRANCH}"
git checkout "${BRANCH}"
git pull --ff-only origin "${BRANCH}"
[ -f .env.production ] || cp .env.production.example .env.production
set_env NODE_ENV production
set_env PORT 3000
set_env API_PREFIX /api/v1
set_env PUBLIC_URL http://localhost:8088
set_env FRONTEND_ORIGIN http://localhost:8088
set_env VITE_API_URL /api/v1
set_env FILE_STORAGE_ROOT /app/storage/private
set_env MAX_UPLOAD_BYTES 2097152
for key in POSTGRES_PASSWORD JWT_SECRET JWT_REFRESH_SECRET ADMIN_PASSWORD; do
  value="$(env_value "${key}")"
  case "${value}" in
    ""|change_on_server|generate_on_server|change_before_deploy)
      fail "Defina un valor seguro para ${key} en .env.production antes de desplegar."
      ;;
  esac
done
docker compose --env-file .env.production config >/tmp/licer-compose-config.yml
docker compose --env-file .env.production build
docker compose --env-file .env.production up -d postgres
docker compose --env-file .env.production run --rm backend pnpm prisma:deploy
if [ "${SEED_DEMO}" = "true" ]; then
  docker compose --env-file .env.production run --rm backend pnpm prisma:seed
fi
docker compose --env-file .env.production up -d
bash scripts/server/03-healthcheck.sh
info "Despliegue completado. El servidor se verifica por localhost:8088."
