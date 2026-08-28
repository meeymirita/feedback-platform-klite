# syntax=docker/dockerfile:1

# ─────────────────────────────────────────────────────────────
# base — общий слой: Node 22 + рабочая директория + init-процесс
# ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS base
WORKDIR /app
# dumb-init корректно пробрасывает сигналы (SIGTERM/SIGINT) в Node,
# иначе контейнер останавливается по таймауту вместо graceful shutdown.
RUN apk add --no-cache dumb-init
ENV TZ=Europe/Moscow

# ─────────────────────────────────────────────────────────────
# deps — установка ВСЕХ зависимостей (dev тоже нужны для сборки TS)
# Отдельный слой: пересобирается только при изменении package*.json
# ─────────────────────────────────────────────────────────────
FROM base AS deps
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
# build — компиляция TypeScript → dist/, затем удаление dev-зависимостей
# ─────────────────────────────────────────────────────────────
FROM deps AS build
ENV NODE_ENV=production
COPY . .
RUN npm run build \
 && npm prune --omit=dev

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
