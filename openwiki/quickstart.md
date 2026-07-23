# Licer — Portal de Licitaciones Privadas (Quickstart)

**Licer** is a private procurement and tendering platform with two portals: an **Internal Dashboard** for procurement staff and a **Supplier Portal** for registered vendors. Built as a pnpm monorepo with a NestJS/Prisma/PostgreSQL backend and React/Vite/TypeScript frontend.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | NestJS 10, TypeScript, Prisma 5 (PostgreSQL 16) |
| **Frontend** | React 19, Vite 6, TypeScript |
| **State/Fetching** | TanStack React Query 5, React Context (auth only) |
| **Forms** | React Hook Form 7 |
| **Icons** | Lucide React (single library enforced by CI) |
| **Auth** | JWT access + refresh tokens, Passport, bcryptjs |
| **Infrastructure** | Docker Compose, Nginx (SPA proxy to API) |
| **CI/CD** | GitHub Actions (push/PR to `main`, TZ: America/Asuncion) |
| **Code Quality** | Prettier 3.5.3, ESLint 9, TypeScript strict |

## Domain Overview

| Area | Summary |
|------|---------|
| **Tendering** | Full lifecycle: BORRADOR → REVISION → PUBLICADA → CONSULTAS_CERRADAS → RECEPCION → CERRADA → EVALUACION → ADJUDICADA/CANCELADA/DESIERTA/ARCHIVADA |
| **Bidding** | Suppliers submit versioned bids with line items; replacement allowed per tender config; unique receipt codes |
| **Supplier Mgmt** | Registration with RUC (Paraguay tax ID), legal name, staff, documents; status workflow PENDIENTE → ACTIVO/OBSERVADO/BLOQUEADO/INACTIVO |
| **Q&A** | Suppliers ask questions on tenders; internal staff answer (with publish control) |
| **Evaluation** | Categorized scoring: DOCUMENTAL, TECNICA, ECONOMICA — configurable criteria per tender, scored by designated evaluators |
| **Awards** | Award to winning bid, cancel tender, or declare deserted; approver-controlled |
| **Audit** | Every request logged with actor, action, entity, IP, result |
| **Notifications** | DB-backed notification records (email via Nodemailer) |
| **Files** | Private storage with sha256, MIME + extension + binary signature validation; max 2 MB; PDF/PNG/JPEG only |
| **RBAC** | 7 roles, 57+ permissions in `resource:action:scope` format; ADMIN bypass permission checks |

## Quick Links

| Page | What You'll Find |
|------|------------------|
| [Architecture Overview](architecture/overview.md) | System architecture, module map, data flow, key decisions |
| [Auth & RBAC](architecture/auth-rbac.md) | Auth flow, roles, permissions, guards, session management |
| [Tender Lifecycle](domain/tender-lifecycle.md) | Tender states, operations, code generation, Q&A, documents |
| [Supplier & Bidding](domain/supplier-bidding.md) | Registration, documents, staff, bid flow, evaluations, awards |
| [Data Model](domain/data-model.md) | Entity summary, all enums, indexes, migration history |
| [Deployment & Operations](operations/deployment.md) | Docker Compose, server setup scripts, CI/CD, env config |
| [Testing Guidance](testing/guidance.md) | Unit/E2E tests, UX verification, CI pipeline |

## Repository Structure

```
/
├── backend/                     NestJS 10 API
│   ├── prisma/
│   │   ├── schema.prisma        ~650 lines, 20+ models, 16 enums
│   │   ├── migrations/          9 migration files (versioned)
│   │   └── seed.ts              RBAC seed: 57 permissions, 7 roles, admin + test user
│   ├── src/
│   │   ├── app.module.ts        Root module with 21 feature modules + 4 global guards + 1 interceptor
│   │   ├── main.ts              Bootstrap (CORS, ValidationPipe, cookie-parser, exception filter)
│   │   ├── auth/                Login, JWT, refresh, password change/reset, auth-security
│   │   ├── common/              Guards (JWT, roles, permissions, password-change, ownership), decorators, interceptor, filter
│   │   ├── config/              env.validation.ts — fail-fast on weak/default secrets
│   │   ├── prisma/              PrismaClient singleton
│   │   ├── users/               User CRUD
│   │   ├── roles/               Role & permission management
│   │   ├── suppliers/           Supplier registration, staff, documents
│   │   ├── tenders/             Tender CRUD + lifecycle state transitions
│   │   ├── tender-documents/    Tender document attachments (BASE, ANEXO, ADDENDA, etc.)
│   │   ├── tender-categories/   Category catalog CRUD
│   │   ├── tender-branches/     Branch catalog CRUD
│   │   ├── questions/           Q&A threads between suppliers and staff
│   │   ├── bids/                Bid creation, submission, replacement, versioning
│   │   ├── evaluations/         Scoring bids against criteria
│   │   ├── awards/              Award, cancel, desert operations
│   │   ├── files/               File upload/download with MIME/signature validation
│   │   ├── reports/             Report endpoints
│   │   ├── notifications/       Notification records
│   │   ├── requesting-areas/    Requesting area catalog
│   │   ├── audit/               Audit log service
│   │   └── health/              GET /api/v1/health endpoint
│   └── test/                    auth.e2e-spec.ts, jest-e2e.config.ts
├── frontend/                    React 19 SPA
│   └── src/
│       ├── App.tsx              Route definitions (lazy-loaded)
│       ├── main.tsx             Entry point (React 18 createRoot, React Query provider)
│       ├── config/api.ts        API_URL from VITE_API_URL env var
│       ├── modules/
│       │   ├── auth/            LoginPage, ResetPasswordPage, ChangePasswordPage
│       │   ├── internal-dashboard/  InternalLayout + InternalPages.tsx (14 pages, 2957 lines) + CatalogPages.tsx
│       │   └── supplier-portal/     SupplierLayout + SupplierPages.tsx (11 pages, 1698 lines)
│       ├── shared/
│       │   ├── api/client.ts    Thin fetch wrapper with Bearer auth + ApiError handling
│       │   ├── auth/            AuthProvider (Context + localStorage) + ProtectedRoute
│       │   ├── components/      12 reusable components
│       │   ├── utils/           format.ts + format.test.ts (Vitest)
│       │   └── types.ts         Shared TypeScript interfaces
│       └── styles/              tokens.css → base.css → components.css (design system)
├── docs/                        DEPLOYMENT.md, DEVELOPMENT.md, SECURITY.md, UX audit + migration plan
├── scripts/server/              Debian deployment (4 scripts + README)
├── scripts/verify-ux.mjs        Static UX validation (run in CI)
├── docker/nginx/default.conf    SPA serve + /api/ proxy_pass
├── compose.yml                  PostgreSQL 16 + Backend + Nginx
└── .github/workflows/           ci.yml (verify) + openwiki-update.yml (scheduled)
```

## Running Locally

```bash
corepack enable
pnpm install
pnpm --filter @licer/backend prisma:generate
pnpm --filter @licer/backend prisma:migrate
pnpm --filter @licer/backend prisma:seed
pnpm dev:backend   # http://localhost:3000/api/v1
pnpm dev:frontend  # http://localhost:5173
```

See [docs/DEVELOPMENT.md](/docs/DEVELOPMENT.md) for details.

## Git Evolution (recent commits, newest first)

| Commit | Phase |
|--------|-------|
| `39fa6f2` | **Security hardening**: env validation, AuthSession model, refresh rotation, E2E auth tests, rate limit model |
| `a63c973` | **Password enforcement**: mustChangePassword flag, ChangePasswordPage, guard |
| `f6f28f0` | **Consolidation**: audit + supplier staff migrations, seed updates |
| `57f4626` | **UX fix**: sidebar collapsed control overlap |
| `fe9b018` | **UX redesign**: simplified nav, redesigned auth pages |
| `9ca19dd` | **UX validation**: responsive test + screenshots |
| `2b51be9` | **UX routes**: feedback states, responsive migration |
| `b27891e` | **Design system**: CSS tokens, ApplicationShell, UiPrimitives |
| `3078af6` | **UX audit**: documented all routes and pain points |
| `2b1aae2` | **Domain expansion**: suppliers, questions, bids, phone input |
| `3e583aa` | **V2.0**: major restructure, removed backups, tender branches/categories |
| `feb159c` | Act2: username login |
| `804a4e3` | Act1: initial backup structure |

## Backlog / Known Gaps

| Area | Issue |
|------|-------|
| **Rate limiting** | `SecurityAttempt` model exists, login does not update `failedLoginCount`/`lockedUntil` — throttling not fully wired |
| **Password reset** | Frontend stub + backend endpoints exist but token generation/email delivery is incomplete pending SMTP |
| **Frontend page splitting** | `InternalPages.tsx` (2957 lines) and `SupplierPages.tsx` (1698 lines) are monolithic — use `lazy()` and route splitting |
| **Pagination metadata** | Backend returns flat arrays without `total`/`page`/`pageSize` |
| **Docker image size** | Backend Dockerfile copies full build stage to runtime; should use `pnpm deploy --prod` |
| **Backend ESLint** | ESLint declared in scripts but not installed as backend dependency at last audit |
| **No frontend component tests** | Only format.test.ts exists; no component/route tests |

## Quick start (Docker production)

```bash
cp .env.production.example .env.production
# Edit secrets: POSTGRES_PASSWORD, JWT_SECRET, JWT_REFRESH_SECRET
chmod 600 .env.production

docker compose --env-file .env.production up -d postgres
docker compose --env-file .env.production run --rm backend pnpm prisma:deploy
docker compose --env-file .env.production run --rm backend pnpm prisma:seed
docker compose --env-file .env.production up -d --build
curl http://localhost:8088/api/v1/health
```

## Quality commands

```bash
pnpm format           # Prettier
pnpm format:check
pnpm lint             # ESLint
pnpm ux:check         # UX consistency validation
pnpm build            # Backend + frontend
pnpm test             # Backend unit tests + frontend tests
pnpm test:e2e         # Backend E2E tests (requires DB)
```

## Key env variables

See `.env.example` and `.env.production.example`. Critical vars:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Access token signing (min 32 chars) |
| `JWT_REFRESH_SECRET` | Refresh token signing (min 32 chars) |
| `AUTH_RATE_LIMIT_MAX_ATTEMPTS` | Max failed login attempts per window (default 20) |
| `AUTH_ACCOUNT_LOCK_SECONDS` | Account lock duration (default 900) |
| `PASSWORD_RESET_ENABLED` | Enable email-based password reset (requires SMTP) |

## Documentation map

| Page | What it covers |
|------|----------------|
| [Architecture overview](/openwiki/architecture/overview.md) | System design, module dependencies, data flow |
| [Domain & data model](/openwiki/domain/data-model.md) | Core entities, status machines, relationships |
| [Security & RBAC](/openwiki/security/auth-rbac.md) | Auth flow, guards, permissions, rate limiting |
| [Operations & deployment](/openwiki/operations/deployment.md) | Docker, CI/CD, Debian scripts, runbook |
| [Testing guidance](/openwiki/testing/guidance.md) | Test strategy, running tests, coverage areas |

## Backlog

| Area | Source anchor | Reason deferred |
|------|-------------|----------------|
| Frontend component library | `/frontend/src/shared/components/` | Well-documented in UX audit; stable but monolithic |
| Reporting module | `/backend/src/reports/` | Small surface, trivial CRUD |
| Notification internals | `/backend/src/notifications/` | Purely DB-backed, no email integration yet |
