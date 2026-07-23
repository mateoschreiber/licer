# Architecture Overview

## System Design

Licer is a three-tier Docker Compose application:

```
[Browser] ──HTTPS──> [Nginx :8088]
                        │
                    ┌───┴───┐
                    │       │
               SPA (/)   API (/api/*)
                    │       │
                    │   [Backend :3000]
                    │       │
                    │   [PostgreSQL :5432]
                    │
              Static files served by Nginx
```

All three services run on a single `licer_internal` bridge network. The frontend is served as a static SPA by Nginx, which proxies `/api/` requests to the backend. No hardcoded IP addresses — the frontend uses a relative `/api/v1` path, so users access the platform via `http://<SERVER_IP>:8088` without recompilation.

## Backend Module Architecture

The `AppModule` (`backend/src/app.module.ts`) registers **21 feature modules** plus infrastructure modules:

```
AppModule
├── Infrastructure
│   ├── ConfigModule         (global, validate via env.validation.ts)
│   ├── PrismaModule         (PrismaClient singleton)
│   ├── HealthModule         (GET /api/v1/health)
│   └── AuditModule          (audit log storage)
│
├── Auth & Access Control
│   ├── AuthModule           JWT login, refresh, logout, change/reset password
│   ├── UsersModule          User CRUD
│   └── RolesModule          Role & permission CRUD
│
├── Core Domain
│   ├── SuppliersModule      Supplier registration, staff, documents
│   ├── TendersModule        Tender CRUD, state management, code generation
│   ├── TenderDocumentsModule Tender document upload/void
│   ├── TenderCategoriesModule Catalog: tender categories
│   ├── TenderBranchesModule   Catalog: tender branches
│   ├── QuestionsModule      Q&A threads
│   ├── BidsModule           Bid submission/replacement
│   ├── EvaluationsModule    Scoring by category (documental/técnica/económica)
│   ├── AwardsModule         Award/cancel/desert decisions
│   ├── RequestingAreasModule Requesting areas CRUD
│   ├── FilesModule          File upload/download with validation
│   ├── NotificationsModule  Notification records
│   └── ReportsModule        Report generation
```

Each module follows NestJS convention: `controller`, `service`, `dto/`, and optional `*.spec.ts`.

## Cross-Cutting Concerns

### Global Guards (evaluation order)

Registered as `APP_GUARD` in `AppModule`:

1. **`JwtAuthGuard`** — Validates JWT on every request (except `@Public()` routes). Uses Passport JWT strategy.
2. **`PasswordChangeRequiredGuard`** — Blocks users with `mustChangePassword === true` (except `@AllowBeforePasswordChange()` routes).
3. **`RolesGuard`** — Checks user has at least one required role via `@Roles()` decorator.
4. **`PermissionsGuard`** — Checks specific permission codes (`resource:action:scope`); `ADMIN` role bypasses all permission checks.

### Global Interceptor

- **`AuditInterceptor`** — Wraps every controller response to log `AuditLog` records with actor, action, entity, IP, and result. Fire-and-forget via `void this.auditService.log(...)` — failures are silently swallowed.

### API Conventions

- Base path: `/api/v1` (configurable via `API_PREFIX`)
- CORS: Strict allow-list from `FRONTEND_ORIGIN` env var + localhost dev origins
- Validation: Global `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`
- Pagination: `?page=1&pageSize=20&search=term` — currently returns flat arrays without `total`/`page`/`pageSize` metadata
- Soft deletes: Most models have `deletedAt: DateTime?` for logical deletion
- Cookie parser: Enabled for refresh token cookie

## Frontend Architecture

### Layer Structure

```
frontend/src/
├── config/api.ts           VITE_API_URL → API base URL
├── shared/
│   ├── api/client.ts       Thin fetch wrapper with Bearer auth
│   ├── auth/               AuthProvider (Context + localStorage) + ProtectedRoute
│   ├── components/         12 reusable components
│   ├── utils/format.ts     Date, money, tender code formatters
│   ├── utils/format.test.ts Vitest unit tests
│   └── types.ts            TypeScript interfaces
├── modules/
│   ├── auth/               LoginPage, ResetPasswordPage, ChangePasswordPage
│   ├── internal-dashboard/ InternalLayout + InternalPages.tsx (14 exports) + CatalogPages.tsx
│   └── supplier-portal/    SupplierLayout + SupplierPages.tsx (11 exports)
└── styles/
    ├── tokens.css          Design tokens (CSS custom properties)
    ├── base.css            Element reset + base typography
    └── components.css      All component styles
```

### State Management

**No Redux or Zustand.** Lightweight approach:
- **TanStack React Query 5** — server state (caching, mutations, retries)
- **React Context** — auth state only (persisted to `localStorage`)
- **React Hook Form 7** — form state and validation
- **Custom DOM events** (`lici:toast`, `lici:confirm`) — decoupled feedback

### Shared Component Library

| Component | Purpose |
|---|---|
| `ApplicationShell` | Main layout: responsive sidebar (collapsible) + mobile drawer |
| `AuthLayout` | Split-panel: dark green gradient + branded form |
| `DataTable` | Generic typed table with client-side pagination (default 12/page) |
| `FeedbackHost` | Toast notifications (4.5s auto-dismiss) + global confirmation modal (Promise-based) |
| `UiPrimitives` | MetricCard, MiniBarChart, LoadingState, EmptyState, Pagination |
| `PageHeader` | Page title + description + actions bar |
| `StatusBadge` | Color-coded status pills (green/amber/red/neutral) |
| `PhoneInput` | International phone selector (defaults to Paraguay via libphonenumber-js) |
| `SupplierSelector` | Autocomplete supplier search by RUC/legal name |
| `TenderSelector` | Autocomplete tender search by code/title |
| `ConfirmDialog` | Standalone modal confirmation |
| `NotFoundPage` | Friendly 404 with contextual redirect |

### CSS Design System (3 layers)

1. **`tokens.css`** — CSS custom properties: `--color-primary-500: #17806d`, font stack, spacing scale, shadows, breakpoints (48rem/72rem), z-index layers (base:1 → toast:100)
2. **`base.css`** — Box-sizing reset, `:focus-visible` outline, form inheritance, table styling, `.sr-only`
3. **`components.css`** — All component + page styles: sidebar (16.5rem/4.5rem collapsed), auth split-panel, form layouts (grid-2col/grid-4col), DataTable, feedback overlays, responsive breakpoints

### Route Structure

**Internal Dashboard** (roles: ADMIN, COMPRAS, AREA_SOLICITANTE, EVALUADOR_TECNICO, EVALUADOR_ECONOMICO, APROBADOR, AUDITOR)

| Path | Page |
|------|------|
| `/internal` | DashboardPage (metrics) |
| `/internal/users-roles` | UsersRolesPage |
| `/internal/requesting-areas` | RequestingAreasPage |
| `/internal/suppliers` | SuppliersManagementPage |
| `/internal/suppliers/:id` | SupplierDetailPage |
| `/internal/tenders` | TendersManagementPage |
| `/internal/tenders/new` | TenderCreateEditPage |
| `/internal/tenders/categories` | TenderCategoriesPage |
| `/internal/tenders/branches` | TenderBranchesPage |
| `/internal/tenders/:id` | TenderDetailInternalPage |
| `/internal/questions` | QuestionsInboxPage |
| `/internal/questions/:id` | QuestionDetailInternalPage |
| `/internal/bids` | BidsInboxPage |
| `/internal/bids/:id` | BidDetailInternalPage |
| `/internal/awards` | AwardCancelDesertPage |
| `/internal/audit` | AuditLogsPage |

**Supplier Portal** (role: PROVEEDOR)

| Path | Page |
|------|------|
| `/supplier/profile` | SupplierProfilePage |
| `/supplier/documents` | SupplierDocumentsPage |
| `/supplier/tenders` | AvailableTendersPage |
| `/supplier/tenders/:id` | TenderDetailPage |
| `/supplier/tenders/:id/documents` | TenderDocumentsPage |
| `/supplier/questions` | QuestionsAnswersPage |
| `/supplier/questions/:id` | SupplierQuestionDetailPage |
| `/supplier/bids/new` | CreateBidPage |
| `/supplier/bids/:id` | MyBidDetailPage |
| `/supplier/receipt` | SubmissionReceiptPage |

**Public**: `/login`, `/reset-password`, `/change-password`, `/supplier/register`

## Key Evolutionary Decisions (from git history)

| Commit | Decision |
|--------|----------|
| `3e583aa` (V2.0) | Removed old backups, consolidated docs, added tender branches/categories as separate modules |
| `3078af6` | UX audit before redesign — documented all existing routes, states, and pain points |
| `b27891e` | Created design token system and ApplicationShell before migrating pages one by one |
| `fe9b018` | Simplified navigation (reduced sidebar items) and redesigned auth pages |
| `f6f28f0` | Consolidated audit + supplier staff data into a single migration batch |
| `a63c973` | Added `mustChangePassword` flag — enforced at guard level for new users |
| `39fa6f2` | Security hardening: env validation rejects weak secrets, AuthSession for refresh revocability, E2E auth tests |
| `57f4626` | Fixed sidebar collapse overlap on hover — CSS-only fix
