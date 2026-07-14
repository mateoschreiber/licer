# Auditoría UX

Fecha: 2026-07-14  
Referencia: dashboard SaaS/B2B de analítica aportado por el usuario. Se adoptan sus principios de jerarquía, densidad y modularidad sin copiar marca, textos ni composición exacta.

## Estado ejecutable

- Monorepo pnpm con frontend React 19 + TypeScript + Vite 6 y backend NestJS + Prisma.
- `/login` respondió HTTP 200 en Vite local.
- Formato: correcto.
- Generación Prisma: correcta.
- Build backend y frontend: correcto.
- Tests backend: 6 suites, 14 pruebas correctas.
- Advertencia existente: bundle principal del frontend de 502 kB; conviene dividir por rutas en una fase posterior de rendimiento.

## Arquitectura frontend

- Rutas: React Router 6 en `frontend/src/App.tsx`.
- Datos remotos: TanStack Query 5.
- Formularios: React Hook Form 7.
- Iconos: Lucide React, única librería de iconos.
- Autenticación: contexto propio con sesión en `localStorage` y rutas protegidas por roles.
- Layouts: `InternalLayout` y `SupplierLayout`.
- Estilos: una hoja global de más de 700 líneas, sin capas ni sistema completo de tokens.
- Pantallas: concentradas en dos archivos monolíticos (`InternalPages.tsx`, 3.140 líneas; `SupplierPages.tsx`, 1.682 líneas).

## Inventario de rutas y pantallas

### Públicas

| Ruta                 | Pantalla               | Propósito                 |
| -------------------- | ---------------------- | ------------------------- |
| `/`                  | Redirección            | Lleva al acceso           |
| `/login`             | `LoginPage`            | Inicio de sesión          |
| `/reset-password`    | `ResetPasswordPage`    | Solicitud de recuperación |
| `/supplier/register` | `SupplierRegisterPage` | Registro de proveedor     |

### Portal del proveedor

| Ruta                              | Pantalla                     | Propósito                        |
| --------------------------------- | ---------------------------- | -------------------------------- |
| `/supplier`                       | Redirección                  | Lleva a licitaciones disponibles |
| `/supplier/profile`               | `SupplierProfilePage`        | Perfil, edición y funcionarios   |
| `/supplier/documents`             | `SupplierDocumentsPage`      | Gestión documental propia        |
| `/supplier/tenders`               | `AvailableTendersPage`       | Licitaciones disponibles         |
| `/supplier/tenders/:id`           | `TenderDetailPage`           | Detalle de licitación            |
| `/supplier/tenders/:id/documents` | `TenderDocumentsPage`        | Documentos de licitación         |
| `/supplier/questions`             | `QuestionsAnswersPage`       | Consultas del proveedor          |
| `/supplier/questions/:id`         | `SupplierQuestionDetailPage` | Conversación de consulta         |
| `/supplier/bids/new`              | `CreateBidPage`              | Presentación de oferta           |
| `/supplier/bids/:id`              | `MyBidDetailPage`            | Detalle de oferta propia         |
| `/supplier/receipt`               | `SubmissionReceiptPage`      | Comprobante de presentación      |

### Administración interna

| Ruta                           | Pantalla                     | Propósito                        |
| ------------------------------ | ---------------------------- | -------------------------------- |
| `/internal`                    | `DashboardPage`              | Resumen operativo                |
| `/internal/users-roles`        | `UsersRolesPage`             | Usuarios, roles y permisos       |
| `/internal/requesting-areas`   | `RequestingAreasPage`        | Áreas solicitantes               |
| `/internal/suppliers`          | `SuppliersManagementPage`    | Gestión de proveedores           |
| `/internal/suppliers/:id`      | `SupplierDetailPage`         | Datos y documentos del proveedor |
| `/internal/tenders`            | `TendersManagementPage`      | Gestión de licitaciones          |
| `/internal/tenders/new`        | `TenderCreateEditPage`       | Creación de licitación           |
| `/internal/tenders/categories` | `TenderCategoriesPage`       | Categorías                       |
| `/internal/tenders/branches`   | `TenderBranchesPage`         | Sucursales                       |
| `/internal/tenders/:id`        | `TenderDetailInternalPage`   | Expediente de licitación         |
| `/internal/questions`          | `QuestionsInboxPage`         | Bandeja de consultas             |
| `/internal/questions/:id`      | `QuestionDetailInternalPage` | Respuesta tipo ticket            |
| `/internal/bids`               | `BidsInboxPage`              | Bandeja de ofertas               |
| `/internal/bids/:id`           | `BidDetailInternalPage`      | Detalle de oferta                |
| `/internal/awards`             | `AwardCancelDesertPage`      | Decisión final                   |
| `/internal/audit`              | `AuditLogsPage`              | Logs y expediente de auditoría   |

## Componentes compartidos existentes

- `PageHeader`: título, descripción y acciones.
- `DataTable`: tabla genérica básica.
- `StatusBadge`: semántica de estados.
- `ConfirmDialog`: confirmación modal.
- `PhoneInput`: teléfono internacional.
- `TenderSelector` y `SupplierSelector`: autocompletado.

Faltan primitivas consistentes para cards, métricas enriquecidas, toolbar, tabs accesibles, skeletons, vacíos, errores, notificaciones, menús contextuales, drawer y paginación.

## Hallazgos

### Jerarquía y navegación

- Sidebar plana y directa; las rutas secundarias dependen de enlaces contextuales dentro de cada flujo.
- En tablet/móvil la sidebar se apila sobre el contenido; no existe drawer ni control de apertura.
- No hay encabezado móvil, breadcrumb ni acción para saltar al contenido.
- Las acciones principales y secundarias comparten demasiado peso visual.

### Consistencia visual

- Colores, radios, sombras y espacios están repetidos como valores literales.
- Se usan variables `--primary`, `--border` y `--muted` sin definición central.
- Coexisten `.tabs` y `.section-tabs`, además de variantes ad hoc de paneles, tablas y botones.
- Hay estilos inline y HTML imprimible con estilos embebidos; estos últimos son válidos por pertenecer al documento A4, pero deben alinearse cromáticamente.
- Estados hover/focus/disabled/loading no cubren todos los controles.

### Datos y feedback

- El dashboard solo muestra tres totales; no informa periodo, fuente, actualización ni tendencia.
- Los estados de carga son texto plano; no hay skeletons locales.
- Errores y confirmaciones mezclan mensajes inline con `window.alert` y `window.confirm`.
- No existe sistema de notificaciones ni región `aria-live`.
- Listas extensas no muestran controles de paginación en frontend.

### Tablas y formularios

- Las tablas fuerzan un ancho mínimo y scroll; falta una presentación compacta en móvil y encabezado sticky.
- Toolbars, filtros y búsquedas no tienen una composición común.
- Campos y ayudas no distinguen claramente obligatorio, error y descripción.
- Acciones destructivas no están estandarizadas en todas las pantallas.

### Accesibilidad

- Base semántica aceptable en formularios y modal, pero falta foco visible uniforme, cierre por teclado, gestión inicial/restauración de foco y nombres accesibles en algunos botones de icono.
- No existe enlace “Saltar al contenido”.
- Tabs visuales no implementan toda la interacción de teclado esperada.
- Contraste y tamaño táctil requieren normalización.

### Rendimiento y mantenibilidad

- Los dos archivos monolíticos aumentan el riesgo de regresión, aunque separarlos no es requisito para cambiar la UX.
- El bundle supera 500 kB; la división por rutas es la mejora de rendimiento prioritaria posterior.
- La migración puede hacerse sin cambiar contratos API ni duplicar consultas, reutilizando la estructura de clases existente.

## Criterios de aceptación de la migración

- Un único sistema de tokens y una sola librería de iconos.
- Shell responsive común con navegación agrupada, drawer móvil y estado activo claro.
- Todas las rutas usan las mismas superficies, encabezados, controles, tablas, estados y feedback.
- Sin valores visuales inline en la interfaz React.
- Navegación y acciones utilizables por teclado, foco visible y tamaños táctiles mínimos.
- Formato, tipos, build y tests continúan correctos.
