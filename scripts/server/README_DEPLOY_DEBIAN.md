# Scripts Debian

Ejecute en el servidor. Licer se comprueba por `localhost`; usuarios externos usan la IP actual del servidor en el puerto `8088`.

```bash
bash scripts/server/00-preflight.sh
bash scripts/server/01-install-debian-deps.sh
bash scripts/server/02-deploy-compose.sh
bash scripts/server/03-healthcheck.sh
```

Antes complete `.env.production` desde `.env.production.example`. Consulte `docs/DEPLOYMENT.md`.
