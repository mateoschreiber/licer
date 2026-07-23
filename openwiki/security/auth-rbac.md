# Security & RBAC

Sources: `/backend/src/auth/`, `/backend/src/common/guards/`, `/backend/src/config/env.validation.ts`, `/backend/prisma/seed.ts`.

## Authentication flow

### Login
1. `POST /api/v1/auth/login` — accepts `email` (or `username`) + `password`
2. `AuthSecurityService.assertAllowed('login', ip)` — checks rate limit (per-IP `SecurityAttempt` key)
3. User lookup by email or username (soft-delete filter), bcrypt comparison
4. On failure: increment `failedLoginCount`, lock account after 5 failures (configurable `AUTH_ACCOUNT_LOCK_SECONDS`)
5. On success: reset `failedLoginCount` and `lockedUntil`, issue JWT access token + refresh token
6. Refresh token is persisted in `AuthSession` and also returned as HTTP-only cookie

### JWT payload
```typescript
interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  lastName: string | null;
  mustChangePassword: boolean;
  supplierId: string | null;
  roles: string[];
  permissions: string[];
}
```

The JWT access token encodes `{ sub: userId }`. On every request, `JwtStrategy.validate()` re-fetches the user from DB to build the `AuthenticatedUser` object.

### Refresh token rotation
- `POST /api/v1/auth/refresh` — validates the refresh token, rotates it (revokes old, creates new `AuthSession`)
- `POST /api/v1/auth/logout` — revokes the current `AuthSession`
- Password change also revokes all sessions

### Password reset
- `POST /api/v1/auth/forgot-password` — creates a `PasswordResetToken`, sends email via `PasswordResetMailerService` (only if `PASSWORD_RESET_ENABLED=true` and SMTP is configured)
- `POST /api/v1/auth/reset-password` — consumes the token, updates password, revokes all sessions

### Mandatory password change
- New users are created with `mustChangePassword: true`
- Global `PasswordChangeRequiredGuard` blocks all routes except those with `@AllowBeforePasswordChange()` (`/change-password`, `/logout`)
- `ProtectedRoute` on the frontend also redirects to `/change-password`

## Rate limiting

`AuthSecurityService` provides per-IP rate limiting for login and password reset attempts:

| Config | Default | Description |
|--------|---------|-------------|
| `AUTH_RATE_LIMIT_MAX_ATTEMPTS` | 20 | Max attempts per window |
| `AUTH_RATE_LIMIT_WINDOW_SECONDS` | 600 (10 min) | Rate limit window |
| `AUTH_ACCOUNT_LOCK_SECONDS` | 900 (15 min) | Account lock duration after 5 failed logins |

Blocked IPs and locked accounts both return `429 Too Many Requests` via `HttpException`.

## Authorization guards (evaluation order)

1. **JwtAuthGuard** (`@nestjs/passport`) — validates bearer token; attaches `user` to request
2. **PasswordChangeRequiredGuard** — checks `mustChangePassword`; allows routes with `@AllowBeforePasswordChange()`
3. **RolesGuard** — checks that user has at least one required role (metadata via `@Roles()`)
4. **PermissionsGuard** — checks that user has at least one required permission code; `ADMIN` bypasses all checks

All guards are global (registered in `AppModule`). Routes can opt out via:
- `@Public()` — skips JwtAuthGuard entirely (skip auth)
- `@AllowBeforePasswordChange()` — skips password change check

## Permission model

Permissions use format `resource:action:scope`:

```
resource → action → scope
users    → create → internal
suppliers→ approve → internal
tenders  → read   → published
bids     → create → own
```

The seed defines ~57 permissions and 7 roles. Key roles:

| Role | Scope |
|------|-------|
| `ADMIN` | All permissions (bypasses PermissionsGuard entirely) |
| `COMPRAS` | End-to-end procurement (create tenders, approve suppliers, award) |
| `AREA_SOLICITANTE` | Create and track their own tenders |
| `EVALUADOR_TECNICO` | Read bids, create/update evaluations (documentary/technical) |
| `EVALUADOR_ECONOMICO` | Read bids, create/update evaluations (economic) |
| `APROBADOR` | Read-only access + awards |
| `AUDITOR` | Read-only access + audit log |
| `PROVEEDOR` | Own-profile, published tenders, own questions/bids, own file downloads |

## Environment validation

`/backend/src/config/env.validation.ts` enforces at startup:

- `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET` are required
- JWT secrets must be ≥ 32 characters and not placeholder values
- If `PASSWORD_RESET_ENABLED=true`, SMTP vars must be set

The API will refuse to start with default/placeholder secrets (e.g., `change-me-*`, `replace-with-a-strong-secret`).

## File upload security

- Max 2 MB (`MAX_UPLOAD_BYTES`)
- Only PDF, PNG, JPEG accepted
- Validation: extension + MIME type + binary magic bytes ("magic-bytes" check)
- Stored on private Docker volume (`storage_private`)
- sha256 hash recorded for integrity tracking
- Suppliers can only download files scoped to their supplier profile
- Internal users can download any file via `files:download:internal` permission
