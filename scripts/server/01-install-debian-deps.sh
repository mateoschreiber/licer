#!/usr/bin/env bash
set -euo pipefail

LAN_CIDR="${LAN_CIDR:-192.168.1.0/24}"

info() {
  echo "==> $*"
}

info "Instalando dependencias base"
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg openssl git lsb-release

info "Configurando repositorio oficial Docker para Debian"
sudo install -m 0755 -d /etc/apt/keyrings
if [ ! -f /etc/apt/keyrings/docker.gpg ]; then
  curl -fsSL https://download.docker.com/linux/debian/gpg |
    sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  sudo chmod a+r /etc/apt/keyrings/docker.gpg
fi

. /etc/os-release
arch="$(dpkg --print-architecture)"
codename="${VERSION_CODENAME:?VERSION_CODENAME no definido}"
repo_file="/etc/apt/sources.list.d/docker.list"
echo "deb [arch=${arch} signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian ${codename} stable" |
  sudo tee "${repo_file}" >/dev/null

info "Instalando Docker Engine y Compose plugin"
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

info "Verificando Docker"
sudo systemctl enable --now docker
sudo systemctl --no-pager --full status docker || true
sudo docker version
sudo docker compose version

if ! groups "${USER}" | grep -qw docker; then
  info "Agregando ${USER} al grupo docker; requiere nueva sesion para usar docker sin sudo"
  sudo usermod -aG docker "${USER}"
fi

if command -v ufw >/dev/null 2>&1; then
  info "ufw detectado; permitiendo SSH y HTTP desde LAN sin desactivar firewall"
  sudo ufw allow OpenSSH || true
  sudo ufw allow from "${LAN_CIDR}" to any port 80 proto tcp || true
  sudo ufw status verbose || true
else
  info "ufw no esta instalado; no se instala firewall nuevo en esta etapa"
fi

info "Dependencias Debian listas"
