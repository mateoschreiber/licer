FROM node:22-alpine AS build

ENV PNPM_HOME=/pnpm
ENV PATH="${PNPM_HOME}:${PATH}"

WORKDIR /app

RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@11.7.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json

RUN pnpm install --frozen-lockfile

COPY backend backend
COPY docker docker

RUN pnpm --filter @licer/backend prisma:generate
RUN pnpm --filter @licer/backend build

FROM node:22-alpine AS runner

ENV NODE_ENV=production
ENV PNPM_HOME=/pnpm
ENV PATH="${PNPM_HOME}:${PATH}"

WORKDIR /app

RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@11.7.0 --activate

COPY --from=build /app /app

RUN chmod +x /app/docker/backend/entrypoint.sh

WORKDIR /app/backend

EXPOSE 3000

ENTRYPOINT ["/app/docker/backend/entrypoint.sh"]
CMD ["pnpm", "start:prod"]
