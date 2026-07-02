#!/usr/bin/env bash
set -euo pipefail

SERVER_IP="${SERVER_IP:-192.168.1.54}"
PUBLIC_URL="${PUBLIC_URL:-http://${SERVER_IP}}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@local.test}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin}"
TEST_USER_EMAIL="${TEST_USER_EMAIL:-prueba@local.test}"
TEST_USER_PASSWORD="${TEST_USER_PASSWORD:-admin}"

info() {
  echo "==> $*"
}

curl_json() {
  curl -fsS \
    -H 'Content-Type: application/json' \
    "$@"
}

info "Estado Docker Compose"
docker compose --env-file .env.production ps

info "Health local API"
curl -fsS http://127.0.0.1/api/v1/health
echo

info "Frontend local"
curl -fsSI http://127.0.0.1 | head -n 1

info "Health LAN API"
curl -fsS "${PUBLIC_URL}/api/v1/health"
echo

info "Frontend LAN"
curl -fsSI "${PUBLIC_URL}" | head -n 1

info "Smoke login admin"
admin_status="$(curl_json -o /tmp/licer-admin-login.json -w '%{http_code}' \
  -d "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\"}" \
  "${PUBLIC_URL}/api/v1/auth/login")"
test "${admin_status}" = "201" || test "${admin_status}" = "200"
grep -q 'accessToken' /tmp/licer-admin-login.json
rm -f /tmp/licer-admin-login.json

info "Smoke login proveedor prueba"
supplier_status="$(curl_json -o /tmp/licer-supplier-login.json -w '%{http_code}' \
  -d "{\"email\":\"${TEST_USER_EMAIL}\",\"password\":\"${TEST_USER_PASSWORD}\"}" \
  "${PUBLIC_URL}/api/v1/auth/login")"
test "${supplier_status}" = "201" || test "${supplier_status}" = "200"
grep -q 'accessToken' /tmp/licer-supplier-login.json
rm -f /tmp/licer-supplier-login.json

info "Logs backend tail"
docker compose --env-file .env.production logs --tail=100 backend

info "Logs nginx tail"
docker compose --env-file .env.production logs --tail=100 nginx

info "Healthcheck OK"
