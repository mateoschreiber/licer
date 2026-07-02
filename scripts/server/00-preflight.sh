#!/usr/bin/env bash
set -euo pipefail

SERVER_IP="${SERVER_IP:-192.168.1.54}"
LAN_CIDR="${LAN_CIDR:-192.168.1.0/24}"
TARGET_PATH="${TARGET_PATH:-/opt/licitaciones}"

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

info() {
  echo "==> $*"
}

info "Validando Debian"
test -r /etc/os-release || fail "No se puede leer /etc/os-release"
. /etc/os-release
test "${ID:-}" = "debian" || fail "Este script espera Debian; detectado: ${ID:-desconocido}"

info "Validando usuario y sudo"
whoami
command -v sudo >/dev/null 2>&1 || fail "sudo no esta instalado"
sudo -v

info "Validando IP ${SERVER_IP}"
hostname -I | tr ' ' '\n' | grep -Fx "${SERVER_IP}" >/dev/null || {
  hostname -I
  fail "El servidor no tiene la IP requerida ${SERVER_IP}"
}

info "Memoria y disco"
free -h
df -h /
available_kb="$(df -Pk / | awk 'NR==2 {print $4}')"
test "${available_kb}" -gt 5242880 || fail "Menos de 5GB libres en /"

info "Validando red, DNS e internet"
ping -c 2 8.8.8.8 >/dev/null
ping -c 2 github.com >/dev/null

info "Validando puertos"
ss -tulpn | grep ':22 ' || fail "Puerto 22 no aparece activo"
if ss -tulpn | grep ':80 ' >/tmp/licer-port-80.txt; then
  cat /tmp/licer-port-80.txt
  if ! grep -E 'docker|nginx' /tmp/licer-port-80.txt >/dev/null; then
    fail "Puerto 80 ocupado por un proceso no esperado"
  fi
  echo "Puerto 80 ocupado por nginx/docker existente; aceptable para redeploy."
else
  echo "Puerto 80 libre."
fi

info "Preflight OK para ${TARGET_PATH} en LAN ${LAN_CIDR}"
