# syntax=docker/dockerfile:1

# ─────────────────────────────────────────────────────────────
# base — общий слой: Node 22 (движок требует ^22.18 || >=24.12)
# ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS base
WORKDIR /app
ENV TZ=Europe/Moscow

# ─────────────────────────────────────────────────────────────
# deps — установка зависимостей. Кэшируется по package*.json
# ─────────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

# ─────────────────────────────────────────────────────────────
# development — dev-сервер Vite с HMR (для docker-compose.dev.yml)
# ─────────────────────────────────────────────────────────────
FROM deps AS development
ENV NODE_ENV=development
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ─────────────────────────────────────────────────────────────
# build — сборка статического бандла в dist/ (vite build)
# build-only пропускает vue-tsc: типы проверяются в CI отдельно
# ─────────────────────────────────────────────────────────────
FROM deps AS build
ENV NODE_ENV=production
COPY . .
RUN npm run build-only

# ─────────────────────────────────────────────────────────────
# production — статику отдаёт Caddy, он же реверс-прокси на /api
# и терминация TLS (HTTPS выдаётся автоматически)
# ─────────────────────────────────────────────────────────────
FROM caddy:2-alpine AS production
ENV TZ=Europe/Moscow
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
EXPOSE 80 443
# Живость — через локальный admin-API Caddy. Он слушает 127.0.0.1:2019 (только
# IPv4), поэтому адрес явный: с "localhost" busybox wget уходит в ::1 → refused.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --start-interval=3s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:2019/config/ || exit 1
# CMD берётся из базового образа caddy: caddy run --config /etc/caddy/Caddyfile
