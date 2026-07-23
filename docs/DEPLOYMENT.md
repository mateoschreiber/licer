# Despliegue Docker

## Principios

El servidor trabaja internamente con Docker y `localhost`. El frontend usa `/api/v1`, por lo que cada usuario entra con la IP actual del servidor sin cambiar ni recompilar configuración.

## Instalación

```bash
git clone https://github.com/mateoschreiber/licer.git /opt/licitaciones
cd /opt/licitaciones
cp .env.production.example .env.production
```

Cambie todos los secretos y contraseñas de `.env.production`. Genere `JWT_SECRET` y
`JWT_REFRESH_SECRET` con al menos 32 caracteres aleatorios y proteja el archivo:

```bash
chmod 600 .env.production
```

```bash
docker compose --env-file .env.production up -d postgres
docker compose --env-file .env.production run --rm backend pnpm prisma:deploy
docker compose --env-file .env.production run --rm backend pnpm prisma:seed
docker compose --env-file .env.production up -d --build
curl http://localhost:8088/api/v1/health
```

## Actualización

```bash
cd /opt/licitaciones
git pull --ff-only origin main
docker compose --env-file .env.production build
docker compose --env-file .env.production run --rm backend pnpm prisma:deploy
docker compose --env-file .env.production up -d
```

Desde el servidor verifique `http://localhost:8088`. Desde otra máquina abra `http://<IP_ACTUAL_DEL_SERVIDOR>:8088`.
