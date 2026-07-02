#!/usr/bin/env bash
set -euo pipefail

BACKUP_ROOT="${BACKUP_ROOT:-/opt/licitaciones/backups}"
STAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR="${BACKUP_ROOT}/${STAMP}"

info() {
  echo "==> $*"
}

cd "${TARGET_PATH:-/opt/licitaciones}"
mkdir -p "${BACKUP_DIR}"

set -a
. ./.env.production
set +a

info "Backup PostgreSQL"
docker compose --env-file .env.production exec -T postgres \
  pg_dump -U "${POSTGRES_USER}" "${POSTGRES_DB}" >"${BACKUP_DIR}/postgres.sql"
test -s "${BACKUP_DIR}/postgres.sql"

info "Backup storage privado"
docker run --rm \
  -v licer_storage_private:/data:ro \
  -v "${BACKUP_DIR}:/backup" \
  alpine:3.20 \
  tar -czf /backup/storage_private.tar.gz -C /data .
test -s "${BACKUP_DIR}/storage_private.tar.gz"

sha256sum "${BACKUP_DIR}/postgres.sql" "${BACKUP_DIR}/storage_private.tar.gz" >"${BACKUP_DIR}/SHA256SUMS"

info "Backup creado en ${BACKUP_DIR}"
