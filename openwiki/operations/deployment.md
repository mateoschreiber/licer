# Operations & Deployment

**Source files**: `compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`, `docker/nginx/default.conf`, `scripts/server/`, `docs/DEPLOYMENT.md`, `.github/workflows/ci.yml`

## Docker Compose Stack

```
┌──────────────┐     8088 ┌───────────────────────┐
│   Browser    │─────────>│  nginx:1.27-alpine     │
│              │<─────────│  Serves / → SPA        │
└──────────────┘          │  Proxies /api/ → backend
                          └───────────┬───────────┘
                                      │ :3000
                          ┌───────────▼───────────┐
                          │  backend (Node 22)     │
                          │  NestJS + Prisma       │
                          └───────────┬───────────┘
                                      │ :5432
                          ┌───────────▼───────────┐
                          │  postgres:16-alpine    │
                          └───────────────────────┘
```

| Service | Image | Exposes | Dependencies | Healthcheck |
|---------|-------|---------|-------------|-------------|
| `postgres` | postgres:16-alpine | — (internal) | — | `pg_isready` (10s int., 12 retries) |
| `backend` | Custom multi-stage Node 22 | 3000 (internal) | postgres (healthy) | `GET /api/v1/health` (15s int., 12 retries) |
| `nginx` | nginx:alpine (from frontend build) | `${FRONTEND_PORT:-8088}:80` | backend (healthy) | `wget --spider /` (15s int., 8 retries) |

**Persistent volumes**: `postgres_data`, `storage_private` (file uploads), `backups`

**Network**: Bridge `licer_internal` shared by all services

## Production Deployment (Debian Server)

### Prerequisites

- Debian Linux (script validates OS)
- `sudo` access
- 5+ GB free memory
- Internet connectivity to GitHub

### Automated Setup

```bash
cd /opt/licitaciones
bash scripts/server/00-preflight.sh                  # Validate environment
bash scripts/server/01-install-debian-deps.sh        # Install Docker + Compose + git
bash scripts/server/02-deploy-compose.sh             # Clone + configure + deploy
bash scripts/server/03-healthcheck.sh                # Verify all services
```

### Manual Deployment Steps

```bash
# 1. Prepare env
cp .env.production.example .env.production
# Edit .env.production — set ALL secrets
chmod 600 .env.production

# 2. Start database
docker compose --env-file .env.production up -d postgres

# 3. Apply migrations
docker compose --env-file .env.production run --rm backend pnpm prisma:deploy

# 4. Seed (first time only, or to reset demo data)
docker compose --env-file .env.production run --rm backend pnpm prisma:seed

# 5. Build and start all services
docker compose --env-file .env.production up -d --build

# 6. Verify
curl http://localhost:8088/api/v1/health
```

### Environment Variables (`.env.production`)

| Variable | Required | Notes |
|----------|----------|-------|
| `POSTGRES_DB`, `POSTGRES_USER` | Yes | PostgreSQL credentials |
| `POSTGRES_PASSWORD` | Yes | Must be strong, unique |
| `DATABASE_URL` | Yes | `postgresql://user:pass@postgres:5432/licer` |
| `JWT_SECRET` | Yes | ≥32 chars, not a placeholder |
| `JWT_REFRESH_SECRET` | Yes | ≥32 chars, not a placeholder |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Yes | Initial admin credentials |
| `NODE_ENV` | Yes | `production` |
| `VITE_API_URL` | Yes | `/api/v1` (relative, proxied by nginx) |
| `PASSWORD_RESET_ENABLED` | Optional | Requires SMTP vars if `true` |
| `FRONTEND_PORT` | No | Default `8088` |

**Secret validation**: The backend will refuse to start if `JWT_SECRET` or `JWT_REFRESH_SECRET` are under 32 characters or contain placeholder values (`change-me-*`, `replace-with-*`, etc.).

## Updates

```bash
cd /opt/licitaciones
git pull --ff-only origin main
docker compose --env-file .env.production build
docker compose --env-file .env.production run --rm backend pnpm prisma:deploy
docker compose --env-file .env.production up -d
```

## CI/CD Pipeline

**File**: `.github/workflows/ci.yml`

Triggers: push to `main`, pull requests to `main`

```yaml
steps:
  - Checkout + Node 22
  - corepack: pnpm@11.7.0
  - pnpm install --frozen-lockfile
  - prisma:generate (backend)
  - format:check (Prettier over entire repo)
  - lint (ESLint — backend + frontend)
  - ux:check (scripts/verify-ux.mjs)
  - build (backend + frontend)
  - test (backend Jest + frontend Vitest)
  - test:e2e (backend Supertest — requires DB)
```

Timezone: `America/Asuncion` (Paraguay). All steps run on `ubuntu-latest`.

## UX Validation Script

**File**: `scripts/verify-ux.mjs` — a static Node.js check that runs in CI:

1. Required files exist: `tokens.css`, `base.css`, `components.css`, `ApplicationShell.tsx`, `FeedbackHost.tsx`, `NotFoundPage.tsx`
2. No native `window.alert()` / `window.confirm()` calls anywhere
3. Only Lucide React icons (no react-icons, @fortawesome, @heroicons)
4. No corrupted UTF-8 (`Ã`, `Â`, replacement characters)
5. `styles.css` imports all three CSS layers (tokens → base → components)
6. `.sidebar-collapsed` CSS rules exist for responsive behavior
7. Minimum 37 `<Route>` declarations in App.tsx
8. No removed routes (`/internal/analytics`, `/internal/change-password`, etc.)
9. `InternalLayout` and `SupplierLayout` use `ApplicationShell`

## Backup Considerations

- **PostgreSQL**: Lives in Docker volume `postgres_data`
- **File uploads**: Live in Docker volume `storage_private`
- **Backups volume**: Mounted at `/app/backups` in backend container (for scripted dumps)
- **Git-ignored**: `.env`, `.env.production`, `backups/*`, `storage/*`, `*.sql`, `*.tar.gz`
- **Do NOT commit**: private keys, production env, database dumps, or uploaded files

## Operational Notes

| Topic | Detail |
|-------|--------|
| **Frontend routing** | Uses relative `/api/v1` path — no IP hardcoded in build artifacts |
| **IP mobility** | Users access via `http://<SERVER_IP>:8088`; if IP changes, no reconfig needed |
| **Migrations in prod** | Use `prisma:deploy` (not `prisma:migrate dev`) — safe for repeated runs |
| **Secret validation** | Backend fails fast at startup if JWT secrets are weak/missing |
| **Admin default** | Change `ADMIN_PASSWORD` and `ADMIN_EMAIL` before deploying to production |
| **File limits** | Max 2 MB per upload; only PDF/PNG/JPEG with binary signature verification |
| **Docker cleanup** | Backend Dockerfile copies full build stage to runtime — consider `pnpm deploy --prod` for smaller images |

## Server Scripts Detail

| Script | What It Does |
|--------|-------------|
| `00-preflight.sh` | Validates Debian OS, `sudo` access, >5 GB free RAM, GitHub connectivity, sets `TARGET_PATH` |
| `01-install-debian-deps.sh` | Installs Docker Engine (from official repo), docker compose plugin, git, UFW (optional) |
| `02-deploy-compose.sh` | Clones repo / `git pull --ff-only`, copies env example, validates required secrets, configures production defaults, runs compose + prisma:deploy + optional seed, healthcheck |
| `03-healthcheck.sh` | Shows `docker compose ps`, curls health endpoint, verifies nginx response, shows recent logs |
| `README_DEPLOY_DEBIAN.md` | Summary instructions for the four scripts |
