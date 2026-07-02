# Comandos de Verificacion

## Compose

```bash
cd /opt/licitaciones
docker compose --env-file .env.production config
docker compose --env-file .env.production ps
```

## Healthchecks

```bash
curl -f http://127.0.0.1/api/v1/health
curl -I http://127.0.0.1
curl -f http://192.168.1.54/api/v1/health
curl -I http://192.168.1.54
```

Resultado esperado:

- API health con `status: ok`.
- DB health con `db: ok`.
- Frontend HTTP 200.

## Smoke login

Admin:

```bash
curl -fsS \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@local.test","password":"admin"}' \
  http://192.168.1.54/api/v1/auth/login
```

Proveedor prueba:

```bash
curl -fsS \
  -H 'Content-Type: application/json' \
  -d '{"email":"prueba@local.test","password":"admin"}' \
  http://192.168.1.54/api/v1/auth/login
```

Resultado esperado:

- Ambos devuelven `accessToken`.
- Admin navega al panel interno.
- Proveedor prueba navega al portal proveedor.

## Aislamiento de proveedor

El backend filtra ofertas por `supplierId` para rol `PROVEEDOR`. Una prueba de acceso cruzado debe responder `403`.

## Auditoria de oferta

Al abrir una oferta como usuario interno autorizado:

```bash
docker compose --env-file .env.production exec -T postgres \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -c 'select "action", "entity", "result", "createdAt" from "AuditLog" order by "createdAt" desc limit 20;'
```

Debe existir `BID_VIEW_INTERNAL` para vistas internas y `BID_FILE_DOWNLOAD_INTERNAL` para descargas internas de documentos de oferta.

## Backup

```bash
cd /opt/licitaciones
bash scripts/server/04-backup-now.sh
find /opt/licitaciones/backups -maxdepth 2 -type f -name SHA256SUMS -print
```
