# Licer | Portal de Licitaciones Privadas

Portal de licitaciones privadas con administración interna y portal de proveedores.

## Tecnologías

- NestJS, TypeScript y Prisma
- React, Vite y TypeScript
- PostgreSQL 16
- Docker Compose

## Inicio rápido

Requiere Docker Engine con Docker Compose v2.

```bash
git clone https://github.com/mateoschreiber/licer.git
cd licer
cp .env.production.example .env.production
```

Edite `.env.production` y cambie `POSTGRES_PASSWORD`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ADMIN_EMAIL` y `ADMIN_PASSWORD`.

```bash
docker compose --env-file .env.production up -d postgres
docker compose --env-file .env.production run --rm backend pnpm prisma:deploy
docker compose --env-file .env.production run --rm backend pnpm prisma:seed
docker compose --env-file .env.production up -d --build
curl http://localhost:8088/api/v1/health
```

Abra `http://localhost:8088`.

## localhost e IP dinámica

No existe una IP LAN fija en el código ni en los archivos de ejemplo.

- Servicios y verificaciones del servidor: `localhost`.
- API del frontend: `/api/v1` (ruta relativa).
- Usuarios de la red: `http://<IP_ACTUAL_DEL_SERVIDOR>:8088`.

No establezca `VITE_API_URL` con una IP; debe ser `/api/v1`.

## Desarrollo local

```bash
corepack enable
pnpm install
pnpm --filter @licer/backend prisma:generate
pnpm --filter @licer/backend prisma:migrate
pnpm --filter @licer/backend prisma:seed
pnpm dev:backend
pnpm dev:frontend
```

- Web: `http://localhost:5173`
- API: `http://localhost:3000/api/v1`

## Calidad

```bash
pnpm format
pnpm format:check
pnpm build
pnpm test
```

## Reglas operativas

- Máximo de 2 MB por archivo adjunto.
- Proveedores pueden adjuntar documentos propios.
- Administradores pueden adjuntar documentos a cualquier proveedor.
- No suba `.env.production`, respaldos, archivos privados ni claves.

Documentación: [desarrollo](docs/DEVELOPMENT.md), [despliegue](docs/DEPLOYMENT.md) y [seguridad](docs/SECURITY.md).
