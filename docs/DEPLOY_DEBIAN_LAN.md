# Deploy Debian LAN - Portal de Licitaciones Etapa 1

Servidor objetivo:

- URL: `http://192.168.1.54`
- Usuario SSH: `mateo`
- Ruta: `/opt/licitaciones`
- Red LAN: `192.168.1.0/24`

Esta etapa usa HTTP en LAN, sin TLS publico. TLS, dominio publico y hardening perimetral quedan para una etapa posterior.

## 1. Preflight

```bash
bash scripts/server/00-preflight.sh
```

Valida Debian, sudo, IP `192.168.1.54`, memoria, disco, DNS, internet, SSH y puerto 80.

## 2. Instalar dependencias Debian

```bash
bash scripts/server/01-install-debian-deps.sh
```

Instala `git`, `curl`, `ca-certificates`, `gnupg`, `openssl` y Docker Engine con Docker Compose plugin desde el repositorio oficial de Docker para Debian.

No usa `get.docker.com`.

## 3. Deploy oficial

```bash
bash scripts/server/02-deploy-compose.sh
```

El script:

- Clona o actualiza `https://github.com/mateoschreiber/licer.git` en `/opt/licitaciones`.
- Crea `.env.production` si no existe.
- Genera `POSTGRES_PASSWORD`, `JWT_SECRET` y `JWT_REFRESH_SECRET` si siguen en placeholder.
- Ejecuta `docker compose --env-file .env.production config`.
- Construye imagenes.
- Levanta Postgres.
- Ejecuta `prisma migrate deploy`.
- Ejecuta seed idempotente.
- Levanta backend y Nginx.
- Corre healthchecks y smoke login.
- Crea backup inicial.

## Servicios Docker

- `postgres`: PostgreSQL 16 con volumen persistente, sin puerto publicado a la LAN.
- `backend`: NestJS escuchando en `0.0.0.0:3000`, expuesto solo dentro de la red Docker.
- `nginx`: unico puerto publicado: `80:80`; sirve React y proxya `/api/` al backend.

## URL final

```text
http://192.168.1.54
```

API health:

```text
http://192.168.1.54/api/v1/health
```

## Usuarios seed

- Admin: `admin@local.test` / `admin`
- Proveedor prueba: `prueba@local.test` / `admin`

El proveedor prueba queda vinculado a `Proveedor Prueba` con estado `ACTIVO`.

## Actualizar despliegue

```bash
cd /opt/licitaciones
git pull --ff-only origin main
docker compose --env-file .env.production build
docker compose --env-file .env.production run --rm backend pnpm prisma:deploy
docker compose --env-file .env.production run --rm backend pnpm prisma:seed
docker compose --env-file .env.production up -d
bash scripts/server/03-healthcheck.sh
```

## Ver logs

```bash
cd /opt/licitaciones
docker compose --env-file .env.production logs -f backend
docker compose --env-file .env.production logs -f nginx
docker compose --env-file .env.production logs -f postgres
```

## Backup

```bash
cd /opt/licitaciones
bash scripts/server/04-backup-now.sh
```

Backups:

```text
/opt/licitaciones/backups/YYYYMMDD_HHMMSS/
```

## Rollback

```bash
cd /opt/licitaciones
CONFIRM_ROLLBACK=YES bash scripts/server/05-rollback-last.sh
```

El rollback crea un backup de seguridad antes de restaurar el ultimo backup disponible.
