# Etapa 1 - Modulos y base funcional

Este documento resume el alcance implementado en el repositorio para iniciar el MVP funcional.

## Dentro de alcance

- Monorepo backend/frontend.
- Backend NestJS modular con API bajo `/api/v1`.
- Prisma schema completo con entidades base, enums, indices y relaciones criticas.
- Migracion inicial PostgreSQL.
- Seed de roles, permisos y usuario admin.
- Guards de autenticacion, roles, permisos y aislamiento de proveedor.
- Servicios y controladores base para los modulos solicitados.
- Frontend React/Vite con portal proveedor, panel interno, rutas protegidas y componentes compartidos.
- Pruebas unitarias de flujos de autorizacion criticos.

## Fuera de alcance

- Docker, Nginx y despliegue Debian.
- TLS y hardening productivo.
- Correo transaccional real.
- Storage externo.
- BI avanzado.
- Integraciones ERP.

## Regla de visibilidad de ofertas

La empresa puede ver una oferta apenas el proveedor la envia, siempre que el usuario interno tenga permisos. No existe apertura diferida. Cada vista interna queda auditada.

## Regla de aislamiento proveedor

Todo acceso proveedor se filtra por `supplierId` en backend. El frontend oculta acciones, pero la proteccion real vive en API.
