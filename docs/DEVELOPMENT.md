# Desarrollo

Copie `.env.example` a un archivo local no versionado. PostgreSQL debe estar en `localhost:5432`.

```bash
corepack enable
pnpm install
pnpm --filter @licer/backend prisma:generate
pnpm --filter @licer/backend prisma:migrate
pnpm --filter @licer/backend prisma:seed
pnpm dev:backend
pnpm dev:frontend
```

Use `VITE_API_URL=http://localhost:3000/api/v1`. Para validar:

```bash
pnpm format
pnpm format:check
pnpm build
pnpm test
```

Cree una migración nueva para cada cambio de esquema; no edite migraciones aplicadas.
