# syntax=docker/dockerfile:1

# ─────────────────────────────────────────────────────────────
# base — общий слой: Node 22 + рабочая директория + init-процесс
# ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS base
WORKDIR /app
# dumb-init корректно пробрасывает сигналы (SIGTERM/SIGINT) в Node,
# иначе контейнер останавливается по таймауту вместо graceful shutdown.
RUN apk add --no-cache dumb-init
# package-lock.json пишется локальным npm 11+; в образе npm 10.9 — обновляем,
# иначе `npm ci` спотыкается на конфликте chokidar в дереве @nestjs-modules/mailer.
RUN npm i -g npm@11
ENV TZ=Europe/Moscow

# ─────────────────────────────────────────────────────────────
# deps — установка ВСЕХ зависимостей (dev тоже нужны для сборки TS)
# Отдельный слой: пересобирается только при изменении package*.json
# ─────────────────────────────────────────────────────────────
FROM base AS deps
# Тулчейн для нативных модулей: у argon2 нет musl-prebuild под Alpine,
# node-gyp собирает его из исходников. В production-образ не попадает.
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

# ─────────────────────────────────────────────────────────────
# development — режим разработки с авто-перезапуском (nest --watch)
# Используется через docker-compose.dev.yml с bind-mount исходников
# ─────────────────────────────────────────────────────────────
FROM deps AS development
ENV NODE_ENV=development
COPY . .
EXPOSE 3000
CMD ["dumb-init", "npm", "run", "start:dev"]

# ─────────────────────────────────────────────────────────────
# build — генерация Prisma Client → компиляция TS → dist/ → prune dev-deps
# ─────────────────────────────────────────────────────────────
FROM deps AS build
ENV NODE_ENV=production
COPY . .
# prisma-client генератор пишет TS в src/generated/prisma (в git/образ не
# коммитится), дальше nest build компилирует его в dist/generated/prisma.
RUN npx prisma generate \
 && npm run build \
 && npm prune --omit=dev

# ─────────────────────────────────────────────────────────────
# migrate — одноразовый контейнер: db push + сид MIRA.
# Полные зависимости (prisma CLI, tsx) — их нет в production-образе.
# Запуск на деплое:  docker compose run --rm migrate
# ─────────────────────────────────────────────────────────────
FROM deps AS migrate
ENV NODE_ENV=production
COPY . .
RUN npx prisma generate
CMD ["dumb-init", "sh", "-c", "npx prisma db push && npm run seed"]

# ─────────────────────────────────────────────────────────────
# production — минимальный рантайм: только node_modules (prod) + dist
# ─────────────────────────────────────────────────────────────
FROM base AS production
ENV NODE_ENV=production
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./
# Непривилегированный пользователь node уже есть в образе node:*-alpine
USER node
EXPOSE 3000
CMD ["dumb-init", "node", "dist/main"]
