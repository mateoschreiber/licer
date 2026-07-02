# Operacion Basica

## Estado del stack

```bash
cd /opt/licitaciones
docker compose --env-file .env.production ps
```

## Iniciar

```bash
cd /opt/licitaciones
docker compose --env-file .env.production up -d
```

## Detener

```bash
cd /opt/licitaciones
docker compose --env-file .env.production stop
```

## Reiniciar backend

```bash
cd /opt/licitaciones
docker compose --env-file .env.production restart backend
```

## Ver health

```bash
curl -f http://192.168.1.54/api/v1/health
```

## Migraciones y seed

```bash
cd /opt/licitaciones
docker compose --env-file .env.production run --rm backend pnpm prisma:deploy
docker compose --env-file .env.production run --rm backend pnpm prisma:seed
```

## Logs recientes

```bash
cd /opt/licitaciones
docker compose --env-file .env.production logs --tail=100 backend
docker compose --env-file .env.production logs --tail=100 nginx
docker compose --env-file .env.production logs --tail=100 postgres
```

## Reglas operativas

- No publicar PostgreSQL a la LAN.
- No subir `.env.production` al repo.
- No borrar volumenes sin backup previo.
- No desactivar firewall existente.
- Mantener acceso por `http://192.168.1.54` solo en LAN hasta incorporar TLS.
