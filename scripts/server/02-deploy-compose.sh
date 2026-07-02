#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/mateoschreiber/licer.git}"
BRANCH="${BRANCH:-main}"
TARGET_PATH="${TARGET_PATH:-/opt/licitaciones}"
SERVER_IP="${SERVER_IP:-192.168.1.54}"
PUBLIC_URL="${PUBLIC_URL:-http://${SERVER_IP}}"
FRONTEND_ORIGIN="${FRONTEND_ORIGIN:-${PUBLIC_URL}}"
VITE_API_URL="${VITE_API_URL:-${PUBLIC_URL}/api/v1}"

info() {
  echo "==> $*"
}

set_env() {
  local key="$1"
  local value="$2"
  if grep -q "^${key}=" .env.production; then
    sed -i "s|^${key}=.*|${key}=${value}|" .env.production
  else
    printf '%s=%s\n' "${key}" "${value}" >>.env.production
  fi
}

env_value() {
  local key="$1"
  grep "^${key}=" .env.production | tail -n 1 | cut -d= -f2-
}

info "Preparando ${TARGET_PATH}"
sudo mkdir -p "${TARGET_PATH}"
sudo chown -R "${USER}:${USER}" "${TARGET_PATH}"

if [ ! -d "${TARGET_PATH}/.git" ] && [ ! -f "${TARGET_PATH}/compose.yml" ]; then
  info "Clonando repo ${REPO_URL}"
  git clone --branch "${BRANCH}" "${REPO_URL}" "${TARGET_PATH}"
fi

cd "${TARGET_PATH}"

if [ -d .git ]; then
  info "Actualizando repo rama ${BRANCH}"
  git fetch origin "${BRANCH}"
  git checkout "${BRANCH}"
  git pull --ff-only origin "${BRANCH}"
else
  info "Directorio sin .git; usando artefacto local ya sincronizado"
fi

if [ ! -f .env.production ]; then
  info "Creando .env.production desde template"
  cp .env.production.example .env.production
fi

info "Normalizando variables LAN"
set_env NODE_ENV production
set_env PORT 3000
set_env API_PREFIX /api/v1
set_env PUBLIC_URL "${PUBLIC_URL}"
set_env FRONTEND_ORIGIN "${FRONTEND_ORIGIN}"
set_env VITE_API_URL "${VITE_API_URL}"
set_env COOKIE_SECURE false
set_env FILE_STORAGE_ROOT /app/storage/private
set_env MAX_UPLOAD_BYTES 20971520
set_env ADMIN_EMAIL admin@local.test
set_env ADMIN_PASSWORD admin
set_env TEST_USER_EMAIL prueba@local.test
set_env TEST_USER_PASSWORD admin
set_env TEST_SUPPLIER_RUC 80000000-0

postgres_password="$(env_value POSTGRES_PASSWORD)"
if [ -z "${postgres_password}" ] || [ "${postgres_password}" = "change_on_server" ]; then
  postgres_password="$(openssl rand -hex 24)"
  set_env POSTGRES_PASSWORD "${postgres_password}"
fi

set_env POSTGRES_DB "$(env_value POSTGRES_DB)"
set_env POSTGRES_USER "$(env_value POSTGRES_USER)"
set_env DATABASE_URL "postgresql://$(env_value POSTGRES_USER):${postgres_password}@postgres:5432/$(env_value POSTGRES_DB)?schema=public"

if [ "$(env_value JWT_SECRET)" = "generate_on_server" ] || [ -z "$(env_value JWT_SECRET)" ]; then
  set_env JWT_SECRET "$(openssl rand -hex 32)"
fi

if [ "$(env_value JWT_REFRESH_SECRET)" = "generate_on_server" ] || [ -z "$(env_value JWT_REFRESH_SECRET)" ]; then
  set_env JWT_REFRESH_SECRET "$(openssl rand -hex 32)"
fi

info "Validando compose"
docker compose --env-file .env.production config >/tmp/licer-compose-config.yml

info "Construyendo imagenes"
docker compose --env-file .env.production build

info "Levantando PostgreSQL para migraciones"
docker compose --env-file .env.production up -d postgres
docker compose --env-file .env.production ps

info "Ejecutando migraciones y seed"
docker compose --env-file .env.production run --rm backend pnpm prisma:deploy
docker compose --env-file .env.production run --rm backend pnpm prisma:seed

info "Levantando stack oficial"
docker compose --env-file .env.production up -d
docker compose --env-file .env.production ps

info "Validando healthchecks"
bash scripts/server/03-healthcheck.sh

info "Creando backup inicial"
bash scripts/server/04-backup-now.sh

info "Deploy completado en ${PUBLIC_URL}"
