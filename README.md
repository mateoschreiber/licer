# Portal de Licitaciones Privadas - Etapa 1

Monorepo para la fase de modulos/base funcional del Portal de Licitaciones Privadas.

Stack definido:

- Backend: NestJS + TypeScript estricto
- Frontend: React + TypeScript + Vite
- Base de datos: PostgreSQL
- ORM: Prisma

Esta etapa no incluye Docker, Nginx ni despliegue en Debian. La estructura queda preparada para incorporarlos en una fase posterior.

## Modulos incluidos

Backend:

- auth
- users
- roles
- suppliers
- tenders
- tender-documents
- questions
- bids
- evaluations
- awards
- audit
- notifications
- reports
- files
- common

Frontend:

- auth
- supplier-portal
- internal-dashboard
- suppliers
- tenders
- questions
- bids
- evaluations
- awards
- audit
- files
- shared

## Reglas criticas implementadas como base

- Deny-by-default en autorizacion backend.
- Los proveedores solo acceden a datos vinculados a su `supplierId`.
- Los proveedores no reciben datos, cantidades, rankings, participantes ni ofertas de terceros.
- Los usuarios internos autorizados pueden ver ofertas enviadas inmediatamente.
- Toda vista interna de oferta y toda descarga interna de archivo de oferta genera `AuditLog`.
- El backend rechaza ofertas o reemplazos despues del plazo.
- El proveedor debe estar `ACTIVO` para ofertar.
- Documentos, ofertas y logs se anulan logicamente; no se eliminan fisicamente desde API.
- Los paths de almacenamiento no se exponen en respuestas publicas.

## Instalacion local

```bash
pnpm install
```

## Variables de entorno

Copiar `.env.example` y ajustar valores:

```bash
cp .env.example backend/.env
cp .env.example frontend/.env
```

## Base de datos, migracion y seed

Desde la raiz:

```bash
pnpm --filter @licer/backend prisma:generate
pnpm --filter @licer/backend prisma:migrate
pnpm --filter @licer/backend prisma:seed
```

## Ejecucion local

Backend:

```bash
pnpm --filter @licer/backend dev
```

Frontend:

```bash
pnpm --filter @licer/frontend dev
```

API base:

```text
http://localhost:3000/api/v1
```

Frontend:

```text
http://localhost:5173
```

## Pruebas

```bash
pnpm --filter @licer/backend test
pnpm --filter @licer/frontend build
```

## Usuario seed

El seed crea roles, permisos y un usuario administrador usando:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Valores por defecto de desarrollo:

- Email: `admin@local.test`
- Password: `ChangeMe123!`

## Pendiente fuera de esta fase

- Docker Compose.
- Nginx.
- TLS.
- Hardening Debian.
- Backups productivos.
- Integracion con correo real.
- Storage S3/MinIO.
- CI/CD.
