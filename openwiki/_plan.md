# Wiki Plan — Licer

## Pages to Create

### 1. /openwiki/quickstart.md (ENTRYPOINT)
- High-level overview: what Licer is, stack, architecture at a glance
- Link to every major section
- Backlog section

### 2. /openwiki/architecture/overview.md
- System architecture diagram (text)
- Backend modules map
- Frontend module map
- Data flow patterns
- Key architectural decisions from git history

### 3. /openwiki/architecture/auth-rbac.md
- Authentication flow (JWT, refresh tokens, password change enforcement, rate limiting)
- Authorization model: roles, permissions, guards
- Session management (AuthSession, PasswordResetToken)
- Source: auth module, guards, seed.ts permissions

### 4. /openwiki/domain/tender-lifecycle.md
- Tender status lifecycle (BORRADOR -> ARCHIVADA)
- Core operations: create, publish, close bids, evaluate, award
- Tender codes, items, documents
- Questions & Answers flow
- Source: tenders service, schema, seed

### 5. /openwiki/domain/supplier-bidding.md
- Supplier registration and profile management
- Supplier documents and staff
- Bid submission, replacement, evaluation
- Awards flow
- Source: suppliers service, bids service, awards service

### 6. /openwiki/domain/data-model.md
- Comprehensive entity relationship summary
- All enums with values
- Key indexes and constraints
- Migration history from git log
- Source: schema.prisma

### 7. /openwiki/operations/deployment.md
- Docker Compose architecture
- Server setup scripts
- CI pipeline
- Environment configuration
- Security practices
- Source: compose.yml, Dockerfiles, scripts/, .github/

### 8. /openwiki/testing.md
- Backend test suites (unit + e2e)
- Frontend tests (format.test.ts)
- UX verification script
- CI test pipeline
- Test gaps documented

### 9. /openwiki/source-map.md (optional - inline in quickstart if small)
Could merge into quickstart or skip if existing docs suffice.

## Backlog items
- SecurityAttempt rate limiting model (referenced in schema but incomplete implementation)
- Password reset flow (stub in frontend, incomplete backend)
- Frontend page splitting (InternalPages.tsx 2957 lines is a known maintenance concern)
- Missing ESLint for backend (declared but not configured at time of audit)
- Pagination metadata (backend returns lists without total counts)
