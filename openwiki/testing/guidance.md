# Testing guidance

## Current Test Inventory

### Backend Unit Tests (Jest — 8 spec files)

All use `@nestjs/testing` `Test.createTestingModule` with mocked `PrismaService`:

| File | Tests | What It Covers |
|------|-------|----------------|
| `backend/src/auth/auth.service.spec.ts` | Login, password change, refresh | Auth business logic with mocked Prisma |
| `backend/src/awards/awards.service.spec.ts` | Award, cancel, desert operations | Award lifecycle transitions |
| `backend/src/bids/bids.service.spec.ts` | Bid creation, submission, replacement | Bid versioning and status flow |
| `backend/src/common/guards/roles.guard.spec.ts` | Role-based access control | Guard behavior with role metadata |
| `backend/src/common/guards/password-change-required.guard.spec.ts` | Password enforcement guard | Guard behavior with `mustChangePassword` |
| `backend/src/files/files.service.spec.ts` | Upload, download, MIME validation | File validation logic |
| `backend/src/requesting-areas/requesting-areas.service.spec.ts` | CRUD operations | Requesting area management |
| `backend/src/tenders/tenders.service.spec.ts` | CRUD + lifecycle transitions | Tender status state machine |

### Backend E2E Tests (Supertest)

`backend/test/auth.e2e-spec.ts`:
- Tests login, CORS, error responses via HTTP against a running app instance
- Uses `test/jest-e2e.config.ts`
- **Requires actual PostgreSQL** (`DATABASE_URL` from environment)
- Config: `jest-e2e.config.ts` sets `rootDir: 'test/'`, uses `tsconfig.spec.json`

### Frontend Tests (Vitest)

`frontend/src/shared/utils/format.test.ts`:
- Date formatting (Paraguay locale `es-PY`)
- Money formatting (Guarani currency)
- Tender code display formatting

**Note**: There are NO frontend component tests (no testing-library, no component mounting). This is the largest testing gap.

## Running Tests

```bash
# All tests (backend unit + frontend vitest)
pnpm test

# Backend only
pnpm --filter @licer/backend test

# Backend E2E (requires DATABASE_URL on a running/empty DB)
pnpm --filter @licer/backend test:e2e

# Frontend only
pnpm --filter @licer/frontend test

# UX validation (static Node.js checks, no DB)
pnpm ux:check

# Single backend test file
pnpm --filter @licer/backend test -- --testPathPattern="auth.service"
```

## Writing tests

### Backend service tests pattern

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MyService } from './my.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockDeep } from 'jest-mock-extended'; // if available

describe('MyService', () => {
  let service: MyService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MyService,
        { provide: PrismaService, useValue: mockDeep<PrismaService>() },
      ],
    }).compile();

    service = module.get(MyService);
    prisma = module.get(PrismaService);
  });

  it('should do the thing', async () => {
    prisma.myModel.findMany.mockResolvedValue([/* ... */]);
    const result = await service.findAll(/* ... */);
    expect(result).toEqual(/* ... */);
  });
});
```

### E2E test pattern

Backend E2E tests use `supertest` against a NestJS app instance with a real or test DB. See `backend/test/auth.e2e-spec.ts` for reference.

### Frontend tests

Vitest is configured; tests live as `*.test.ts` files near the code they test. See `frontend/src/shared/utils/format.test.ts` for patterns.

### Running a single test file

```bash
pnpm --filter @licer/backend test -- --testPathPattern="auth.service"
```

## Coverage areas to prioritize

Based on the application's business logic, the most critical test coverage gaps:

| Area | Priority | Why |
|------|----------|-----|
| Tender lifecycle transitions | High | State machine with 10+ statuses; invalid transitions must be rejected |
| Bid creation + replacement | High | Race conditions on `(tenderId, supplierId, version)` unique constraint |
| Bid scoring uniqueness | High | `(bidId, criteriaId, evaluatorId)` unique constraint |
| Supplier document status workflow | Medium | State transitions for document approval |
| File upload validation | Medium | MIME + magic bytes + size limits |
| Permission guard combinations | Medium | Role + permission matrix coverage |
| Auth rate limiting + account lock | Medium | Time-dependent logic with window/boundary conditions |

## Known limitations

- No frontend component tests exist (no testing-library setup)
- No frontend E2E tests (Cypress/Playwright)
- Backend E2E suite has only auth tests
- No coverage thresholds configured in CI
- Backend tests may not have been run with full fidelity (CI reports 8 suites, 14 tests as of UX audit)
