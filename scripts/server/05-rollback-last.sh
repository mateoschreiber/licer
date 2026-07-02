#!/usr/bin/env bash
set -euo pipefail

TARGET_PATH="${TARGET_PATH:-/opt/licitaciones}"
BACKUP_ROOT="${BACKUP_ROOT:-/opt/licitaciones/backups}"

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

info() {
  echo "==> $*"
}

test "${CONFIRM_ROLLBACK:-}" = "YES" || fail "Defina CONFIRM_ROLLBACK=YES para restaurar el ultimo backup"

cd "${TARGET_PATH}"
latest="$(find "${BACKUP_ROOT}" -mindepth 1 -maxdepth 1 -type d | sort | tail -n 1)"
test -n "${latest}" || fail "No hay backups en ${BACKUP_ROOT}"
test -s "${latest}/postgres.sql" || fail "Backup DB invalido: ${latest}/postgres.sql"
test -s "${latest}/storage_private.tar.gz" || fail "Backup storage invalido"

set -a
. ./.env.production
set +a

info "Creando backup de seguridad antes del rollback"
bash scripts/server/04-backup-now.sh

info "Deteniendo servicios de aplicacion"
docker compose --env-file .env.production stop nginx backend

info "Restaurando base de datos desde ${latest}"
docker compose --env-file .env.production exec -T postgres \
  psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -v ON_ERROR_STOP=1 <<SQL
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
SQL
docker compose --env-file .env.production exec -T postgres \
  psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -v ON_ERROR_STOP=1 <"${latest}/postgres.sql"

info "Restaurando storage privado"
docker run --rm \
  -v licer_storage_private:/data \
  -v "${latest}:/backup:ro" \
  alpine:3.20 \
  sh -c 'rm -rf /data/* && tar -xzf /backup/storage_private.tar.gz -C /data'

info "Reiniciando stack"
docker compose --env-file .env.production up -d
bash scripts/server/03-healthcheck.sh

info "Rollback completado desde ${latest}"
