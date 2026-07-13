#!/usr/bin/env bash
set -euo pipefail
TARGET_PATH="${TARGET_PATH:-/opt/licitaciones}"
fail(){ echo "ERROR: $*" >&2; exit 1; }
info(){ echo "==> $*"; }
test -r /etc/os-release || fail "No se puede leer /etc/os-release"
. /etc/os-release
test "${ID:-}" = "debian" || fail "Este script espera Debian"
command -v sudo >/dev/null || fail "sudo no esta instalado"
sudo -v
info "Direcciones actuales del servidor"; hostname -I
info "Memoria y disco"; free -h; df -h /
test "$(df -Pk / | awk 'NR==2 {print $4}')" -gt 5242880 || fail "Menos de 5GB libres"
info "Red"; ping -c 2 github.com >/dev/null
info "Preflight OK para ${TARGET_PATH}. No se requiere IP fija."
