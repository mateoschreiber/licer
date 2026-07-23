# Authentication & RBAC

## Authentication Flow

### Login
1. `POST /api/v1/auth/login` with `email` + `password`
2. Backend validates credentials via `bcryptjs.compare`
3. On success: returns `{ access_token, user }` 
   - `access_token` is a JWT signed with `JWT_SECRET` (15 min expiry)
   - A refresh token JWT is set as an HTTP-only cookie (`jwt_refresh`, 7 day expiry)
   - An `AuthSession` record is created with the hashed refresh token
4. Frontend stores `access_token` and `user_session` in `localStorage`
5. Frontend redirects based on role: `PROVEEDOR` → `/supplier`, others → `/internal`

### Token Refresh
- Frontend calls `POST /api/v1/auth/refresh` when the access token expires
- Backend validates the refresh token cookie, rotates the token (new JWT, new AuthSession record, old one revoked)
- Returns a new `access_token`

### Logout
- `POST /api/v1/auth/logout` clears the refresh cookie and revokes the `AuthSession`
- Frontend clears `localStorage`

### Password Change
- When `user.mustChangePassword === true`, all routes except `/change-password` are blocked
- `POST /api/v1/auth/change-password` requires current password + new password
- On success, `mustChangePassword` is set to `false`
- The `PasswordChangeRequiredGuard` checks this flag on every request (unless decorated with `@AllowBeforePasswordChange()`)

### Password Reset
- Two-phase flow (currently a stub pending SMTP configuration):
  - `POST /api/v1/auth/reset-password/request` — accepts email, would send reset link
  - `POST /api/v1/auth/reset-password/confirm` — accepts token + new password
- Guarded by `PASSWORD_RESET_ENABLED` env var; disabled by default
- `PasswordResetToken` model stores hashed tokens with expiry for revocation

### Rate Limiting
- Schema includes `SecurityAttempt` model with `key`, `count`, `windowStartedAt`, `blockedUntil`
- Auth services reference `failedLoginCount` and `lockedUntil` on the User model
- **Note**: Rate limiting is modeled but NOT fully wired in login flow — this is a known gap

## Authorization Model

### Roles (defined in `seed.ts`)

| Role | Description | Typical Pages |
|---|---|---|
| `ADMIN` | Full system access — all permissions | All internal pages |
| `COMPRAS` | Procurement staff — tenders, suppliers, bids, awards | Tenders, Suppliers, Bids, Awards |
| `AREA_SOLICITANTE` | Requesting department — create tenders, view evaluations | Tender creation, evaluations |
| `EVALUADOR_TECNICO` | Technical evaluator — score bids (documental/técnica) | Evaluations |
| `EVALUADOR_ECONOMICO` | Economic evaluator — score bids (económica) | Evaluations |
| `APROBADOR` | Approver — award/cancel/desert tenders | Awards |
| `AUDITOR` | Read-only access to all data + audit logs | Audit logs, read-only views |
| `PROVEEDOR` | Supplier — own profile, published tenders, own bids | Supplier portal |

### Permissions

Permissions follow the pattern: `resource:action:scope`

Examples:
- `tenders:create:internal` — create tenders (internal staff)
- `tenders:read:published` — read published tenders (suppliers)
- `bids:submit:own` — submit own bids (suppliers)
- `suppliers:approve:internal` — approve supplier registrations (COMPRAS/ADMIN)

Defined as a flat list in `seed.ts` (~57 permissions), assigned to roles via `RolePermission` join table.

### Guard Chain (order matters)

All guards are registered as `APP_GUARD` in `AppModule`:

1. **`JwtAuthGuard`** — Extends Passport's `jwt` strategy. Attaches user to request. Public routes use `@Public()` decorator (e.g., health, login, register).
2. **`PasswordChangeRequiredGuard`** — Redirects users with `mustChangePassword === true`. Routes decorated with `@AllowBeforePasswordChange()` are exempt (e.g., change-password endpoint itself).
3. **`RolesGuard`** — Checks if user has at least one of the required roles via `@Roles('ADMIN', 'COMPRAS')` decorator.
4. **`PermissionsGuard`** — Checks if user has required permission via `@Permissions('tenders:create:internal')` decorator.

### Supplier Ownership Guard

`SupplierOwnershipGuard` is used at the controller level for routes like supplier profile update. It ensures the authenticated user's `supplierId` matches the resource's `supplierId`, or the user has internal bypass permissions.

## Session Management

### AuthSession Model
- Created on login, stores hashed refresh token
- Revoked on logout, password change, or token refresh (old session invalidated)
- `PasswordResetToken` model stores one-time reset tokens with expiry

## Key Source Files

| File | Purpose |
|---|---|
| `backend/src/auth/auth.service.ts` | Login, refresh, logout, password change logic |
| `backend/src/auth/auth-security.service.ts` | Security validation for secrets and tokens |
| `backend/src/auth/jwt.strategy.ts` | Passport JWT extraction and payload construction |
| `backend/src/auth/password-reset-mailer.service.ts` | Email sending for password reset (requires SMTP) |
| `backend/src/auth/auth.controller.ts` | Auth endpoints |
| `backend/src/auth/auth.module.ts` | Auth module configuration |
| `backend/src/common/guards/jwt-auth.guard.ts` | Global JWT guard |
| `backend/src/common/guards/password-change-required.guard.ts` | Password change enforcement |
| `backend/src/common/guards/roles.guard.ts` | Role checking |
| `backend/src/common/guards/permissions.guard.ts` | Permission checking |
| `backend/src/common/guards/supplier-ownership.guard.ts` | Supplier resource ownership |
| `backend/src/common/decorators/` | @CurrentUser, @Permissions, @Roles, @Public, @AllowBeforePasswordChange |
| `backend/src/config/env.validation.ts` | Startup environment validation |
| `backend/prisma/seed.ts` | RBAC seed data (permissions, roles, admin + test user) |
| `backend/test/auth.e2e-spec.ts` | End-to-end auth tests |

## Security Rules (from docs/SECURITY.md and env.validation.ts)

- API does not start if `JWT_SECRET` or `JWT_REFRESH_SECRET` are < 32 chars or placeholder values
- Refresh tokens are rotated on each use and revoked on logout/password change
- Password reset requires `PASSWORD_RESET_ENABLED=true` + SMTP configuration
- File uploads: max 2 MB, only PDF/PNG/JPEG with extension + MIME + binary signature validation
- Suppliers only access their own files; admins can access any supplier's files
- `.env.production` must have `chmod 600` and never be committed
