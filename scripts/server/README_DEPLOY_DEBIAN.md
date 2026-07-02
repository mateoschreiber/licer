# Deploy Debian LAN

Servidor objetivo: `http://192.168.1.54`

Ejecutar en Debian como usuario `mateo`:

```bash
bash scripts/server/00-preflight.sh
bash scripts/server/01-install-debian-deps.sh
bash scripts/server/02-deploy-compose.sh
```

Los scripts no guardan passwords SSH. `.env.production` se crea en el servidor desde `.env.production.example` y no debe subirse a Git.

## Verificacion

```bash
bash scripts/server/03-healthcheck.sh
```

## Backup manual

```bash
bash scripts/server/04-backup-now.sh
```

## Rollback del ultimo backup

```bash
CONFIRM_ROLLBACK=YES bash scripts/server/05-rollback-last.sh
```
