# Reporte técnico — Licer

Fecha: 2026-07-23  
Alcance: revisión estática, configuración, estructura y verificaciones no destructivas.

## Resumen ejecutivo

Licer es un monorepo pnpm para un portal de licitaciones privadas: API NestJS/Prisma/PostgreSQL y SPA React/Vite. La base tiene buenas decisiones iniciales (TypeScript estricto, validación global de DTO, guardas de autorización, migraciones, Docker, CI y documentación), pero antes de un despliegue productivo sostenido deben resolverse las alertas de secretos/autenticación, consistencia de dependencias y pruebas de extremo a extremo.

La principal deuda de mantenimiento está en el frontend: dos archivos concentran gran parte de las pantallas internas y de proveedor. La principal oportunidad de recursos está en la imagen de backend y la higiene local de dependencias.

## Contenido y estructura

```text
.
├── frontend/                 React 19 + Vite + React Query
│   └── src/modules/          autenticación, portal proveedor, dashboard interno
├── backend/                  NestJS 10 + Prisma 5
│   ├── src/                  módulos por dominio (licitaciones, ofertas, proveedores, etc.)
│   └── prisma/               esquema, migraciones y semilla
├── docker/                   Nginx y entrypoint de backend
├── docs/                     desarrollo, despliegue, seguridad y UX
├── compose.yml               PostgreSQL, backend y Nginx
└── .github/workflows/ci.yml  formato, UX, build y tests
```

- Código fuente TypeScript/TSX: 11.968 líneas.
- Pruebas: 8 suites unitarias en backend; no hay pruebas frontend ni E2E.
- Estado Git antes de este reporte: limpio.
- El proyecto declara pnpm 11.7, pero versiona `pnpm-lock.yaml` y también dos `package-lock.json` de npm.

## Hallazgos prioritarios

| Prioridad | Hallazgo | Riesgo / acción requerida |
|---|---|---|
| P0 | Secretos JWT con valores por defecto (`change-me-*`). | Si falta una variable de entorno, los tokens pueden firmarse con secretos conocidos. Validar la configuración al iniciar y abortar si faltan `JWT_SECRET`, `JWT_REFRESH_SECRET`, base de datos y credenciales requeridas. |
| P0 | El archivo local `.env` tiene permisos `644`. | Otros usuarios del host pueden leer secretos. Cambiar a `600`; mantenerlo ignorado por Git (actualmente lo está). |
| P1 | No hay límite de intentos ni bloqueo efectivo de login. | El modelo tiene `failedLoginCount` y `lockedUntil`, pero el login no los actualiza; tampoco se configuró throttling. Implementar rate limit por IP/cuenta, backoff y bloqueo temporal. |
| P1 | Refresh tokens sin rotación ni revocación. | Un token robado permanece utilizable hasta expirar. Persistir sesiones o `jti` hasheado, rotar al refrescar y revocar en logout/cambio de contraseña. |
| P1 | Flujo público de restablecimiento de contraseña es un stub. | Los endpoints responden éxito pero no emiten ni verifican token. Implementarlo completamente o deshabilitarlo hasta que exista correo, token de un solo uso, expiración y auditoría. |
| P1 | Generación de código de licitación basada en `count()` diario. | Dos solicitudes concurrentes pueden generar el mismo código y fallar por la restricción única. Usar secuencia/contador transaccional, UUID visible o reintento ante `P2002`. |
| P1 | Cargas de archivo aceptan tipo MIME y nombre enviados por el cliente. | Se guardan en memoria y luego se reenvía ese MIME. Permitir una lista explícita, detectar tipo real, normalizar nombre, analizar malware si el contexto lo exige y conservar límites por usuario/IP. |
| P1 | El entorno de dependencias local no es reproducible. | `pnpm` solicita purgar `node_modules` por incompatibilidad; no se borró durante la auditoría. Reinstalar desde cero con pnpm y conservar un único lockfile. |
| P2 | El backend no tiene ESLint instalado/configurado y CI no ejecuta lint. | `backend/package.json` declara el script pero no la herramienta; el estándar no se hace cumplir. Añadir ESLint flat config, `typescript-eslint`, reglas de importación/seguridad y un script raíz `lint`. |
| P2 | Paginación devuelve listas sin total/metadatos. | Las vistas no pueden calcular páginas, y las búsquedas pueden escalar sin observabilidad. Retornar `{ data, page, pageSize, total }`, con `count` paralelo y límites ya existentes. |
| P2 | Auditoría se ejecuta sin espera (`void`). | Un fallo de BD o un apagado puede perder eventos sin señal al cliente/monitorización. En acciones críticas usar una cola durable/outbox o registrar y alertar el error. |
| P2 | El `status` de actualización de documento usa un objeto inline sin DTO. | La validación global no puede validar ese objeto como enum. Crear DTO con `@IsEnum(DocumentStatus)`. |

## Calidad de código y diseño

### Fortalezas

- TypeScript estricto en frontend y backend; DTOs con `class-validator` y `ValidationPipe` con lista blanca.
- Autenticación centralizada, guardas globales de JWT, roles, permisos y cambio obligatorio de contraseña.
- Prisma con migraciones y claves/índices en las entidades principales.
- Docker separa frontend servido por Nginx y API; `.dockerignore` no copia entornos ni almacenamiento privado.
- CI instala de forma congelada, genera Prisma, valida formato, compila y ejecuta pruebas.

### Mantenibilidad

- `frontend/src/modules/internal-dashboard/InternalPages.tsx` tiene 3.101 líneas y más de 15 pantallas/funciones; `SupplierPages.tsx` tiene 1.704 líneas. Separar por ruta y feature, extraer hooks de React Query, formularios, tablas y vistas de impresión. Cargar rutas pesadas con `lazy()` para reducir el bundle inicial.
- Servicios del backend de 300–426 líneas concentran reglas y consultas. Extraer políticas/transiciones de estado y repositorios/selectores reutilizables para probarlas de forma aislada.
- Reemplazar el tipo `any` del archivo recibido por una interfaz de Multer y encapsular la política de validación de archivos.
- Configurar Prettier como formateador único y ESLint como analizador; añadir hooks de pre-commit solo después de que CI sea la fuente de verdad.

## Optimización de recursos

- El directorio local `.pnpm-store` ocupa aproximadamente 142 MB. Está ignorado, por lo que no es deuda del repositorio, pero conviene ubicarlo fuera del checkout o limpiarlo en agentes CI efímeros.
- `backend/Dockerfile` copia el directorio completo de la etapa de build a runtime, incluyendo fuentes y dependencias de desarrollo. Crear una etapa de producción con `pnpm deploy --prod` (o `pnpm prune --prod`), copiar solo `dist`, cliente Prisma y dependencias runtime. Reduce imagen, superficie de ataque y tiempo de despliegue.
- Para archivos, el límite actual de 2 MB es positivo. Si aumenta el volumen, evitar buffers en memoria y usar streaming hacia almacenamiento privado/objeto; imponer cuota, expiración y limpieza de huérfanos.
- Añadir índices según consultas reales y medir con `EXPLAIN ANALYZE`. Los filtros frecuentes por estado, fecha y claves foráneas ya tienen una base de índices, pero las búsquedas `contains` insensibles requerirán `pg_trgm`/índices GIN si crecen los datos.

## Pruebas y verificación

- Correcto: `frontend/node_modules/.bin/tsc --noEmit -p frontend/tsconfig.json` terminó sin errores.
- Pendiente: formato, UX check, build completo, tests y lint no pudieron ejecutarse. `pnpm` detecta un árbol de módulos incompatible y solicita eliminar `node_modules`; no se realizó esa operación por ser destructiva fuera del objetivo de auditoría.
- Añadir pruebas E2E con Supertest para login/refresh, autorización por proveedor, carga/descarga de archivos, transiciones de licitación y concurrencia al crear ofertas/códigos.
- Añadir pruebas de componentes/rutas frontend y umbrales de cobertura. Jest recolecta cobertura, pero no establece umbral y CI no publica resultado.

## Plan recomendado

1. Corregir P0: permisos del `.env`, validación fail-fast de secretos y revisión/rotación de cualquier secreto ya expuesto.
2. Corregir P1: rate limit/bloqueo, sesiones de refresh revocables, flujo de reset real, política de archivos y generación transaccional de códigos.
3. Restaurar reproducibilidad: eliminar de forma deliberada los dos `package-lock.json`, reinstalar con `corepack pnpm install --frozen-lockfile` y ejecutar la matriz de CI.
4. Incorporar ESLint, typecheck por paquete, E2E y cobertura mínima en CI.
5. Modularizar las páginas grandes y optimizar la imagen runtime antes de añadir nuevas pantallas.

## Referencias de implementación

- Secretos JWT: `backend/src/auth/auth.module.ts`, `backend/src/auth/jwt.strategy.ts`, `backend/src/auth/auth.service.ts`.
- CORS y validación global: `backend/src/main.ts`.
- Archivos: `backend/src/files/files.controller.ts`, `backend/src/files/files.service.ts`.
- Código concurrente de licitaciones: `backend/src/tenders/tenders.service.ts`.
- Páginas grandes: `frontend/src/modules/internal-dashboard/InternalPages.tsx`, `frontend/src/modules/supplier-portal/SupplierPages.tsx`.
