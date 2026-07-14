# Plan de migración UX

## Alcance

Migración visual y de interacción de todo el frontend, conservando rutas, roles, terminología, datos, contratos API y reglas de negocio.

## Fase 1 — Fundamentos

1. Definir tokens en una hoja dedicada: paleta, tipografía, espacios, radios, bordes, sombras, tamaños, breakpoints, capas, movimiento, estados y gráficos.
2. Establecer reset, foco, selección, tipografía y comportamiento responsive base.
3. Conservar Lucide React como única fuente de iconos.

Resultado: ninguna página necesita declarar valores visuales propios para resolver patrones comunes.

## Fase 2 — Shell y componentes

1. Crear un `AppShell` compartido con sidebar agrupada, búsqueda rápida local, encabezado móvil, drawer, perfil y cierre de sesión.
2. Normalizar `PageHeader`, tabs, toolbar, cards, métricas, botones, campos, badges, tablas y modales.
3. Añadir `LoadingState`, `EmptyState`, `ErrorState`, `Pagination`, `ToastProvider` y primitives de icon button/menú.
4. Mantener compatibilidad con las clases actuales durante la migración y eliminar la apariencia heredada al finalizar.

Resultado: layouts interno y proveedor consumen el mismo shell y todas las pantallas comparten estados y controles.

## Fase 3 — Migración por flujo

1. Acceso y registro: login, recuperación y alta de proveedor.
2. Shells: navegación interna y del proveedor.
3. Resumen y listados: dashboard, licitaciones, proveedores, consultas, ofertas, auditoría y comunicaciones.
4. Detalles: proveedor, licitación, oferta, consulta, expediente y comprobante.
5. Formularios y CRUD: usuarios/roles, áreas, categorías, sucursales, licitación, oferta, documentos y perfil.
6. Evaluación y decisión: matrices documental/técnica/económica, comparación y adjudicación.

Resultado: todas las rutas usan el sistema nuevo; no queda una pantalla con el aspecto anterior.

## Fase 4 — UX y responsive

1. Desktop: sidebar persistente y contenido de ancho fluido.
2. Tablet: sidebar colapsable y grids reducidos.
3. Móvil: drawer, tabs desplazables, cards a una columna, tablas con scroll seguro y acciones táctiles.
4. Sustituir cargas textuales por skeletons, vacíos por estados accionables y alertas nativas por feedback consistente.
5. Unificar foco, disabled, loading, error y confirmaciones.

Resultado: flujos completos a 1440, 1024, 768 y 390 px sin pérdida funcional.

## Fase 5 — Validación

1. `pnpm format:check`.
2. Generación Prisma, type checking y build completo.
3. Tests backend.
4. Revisión de todas las rutas, navegación por teclado y responsive.
5. Capturas antes/después y reporte final en `docs/ux-validation.md`.

## Estrategia de commits

1. `docs(ux): audit current interface and migration plan`
2. `feat(ux): add design tokens and shared application shell`
3. `feat(ux): migrate application screens and responsive states`
4. `test(ux): validate responsive interface and document results`

## Riesgos controlados

- No se modifica el backend ni los contratos API.
- Los componentes nuevos preservan props y clases consumidas por las páginas.
- Los cambios se validan después de cada fase.
- La división del bundle por rutas queda separada si exige modificar la estrategia de carga y puede afectar el despliegue.
