# Docker: сборка и запуск проекта

Документация по всем файлам, отвечающим за контейнеризацию `feedback-platform-klite`.
Для каждого файла ниже приведён его путь, полное содержимое и построчное пояснение.

- Автор / префикс ресурсов: **meeymirita** (`mira`)
- Имя compose-проекта: **meeymirita-feedback-platform-klite**
- Точка входа / TLS: **Caddy** (HTTPS выдаётся автоматически)

---

## Оглавление

1. [Архитектура контейнеров](#1-архитектура-контейнеров)
2. [Быстрый старт](#2-быстрый-старт)
3. [`.env.example`](#3-envexample)
4. [`backend/Dockerfile`](#4-backenddockerfile)
5. [`backend/.dockerignore`](#5-backenddockerignore)
6. [`frontend/Dockerfile`](#6-frontenddockerfile)
7. [`frontend/Caddyfile`](#7-frontendcaddyfile)
8. [`frontend/.dockerignore`](#8-frontenddockerignore)
9. [`.dockerignore` (корень)](#9-dockerignore-корень)
10. [`docker-compose.yml`](#10-docker-composeyml)
11. [`docker-compose.dev.yml`](#11-docker-composedevyml)
12. [Частые команды](#12-частые-команды)
13. [Траблшутинг](#13-траблшутинг)

---

## 1. Архитектура контейнеров

```
        host:${HTTP_PORT:-8080}  (HTTP → редирект на HTTPS)
        host:${HTTPS_PORT:-8443} (HTTPS, точка входа)
                                │
                                ▼
                   ┌────────────────────────────┐
                   │  frontend  (Caddy :80/:443) │  образ meeymirita/feedback-klite-frontend
                   │  • автоматический HTTPS/TLS  │  тома meeymirita_caddy_data / _config
                   │  • отдаёт собранный SPA      │
                   │  • / → index.html (fallback) │
                   │  • /api/* → backend:3000     │
                   └───────────┬────────────────┘
                               │  сеть meeymirita-net (bridge)
                               ▼
                   ┌────────────────────────────┐
                   │  backend  (Nest :3000)      │  образ meeymirita/feedback-klite-backend
                   │  node dist/main             │
                   └──────┬──────────────┬──────┘
                          │              │
                          ▼              ▼
        ┌────────────────────────┐  ┌────────────────────────┐
        │ postgres:16-alpine     │  │ redis:7-alpine :6379   │
        │ :5432 · том …_pgdata   │  │ сессии · том …_redisdata│
        └────────────────────────┘  └────────────────────────┘
```

**Почему Caddy и почему один контейнер, а не отдельный nginx.** В ТЗ на схеме
отдельно нарисованы `frontend` (статика) и `nginx` (реверс-прокси). Здесь оба
объединены в один сервис на **Caddy**: он раздаёт статику SPA, проксирует `/api`
на `backend` и сам, без ручной возни с сертификатами, поднимает HTTPS —
для `localhost` через встроенный доверенный CA, для реального домена — через
ACME (Let's Encrypt / ZeroSSL). Это единая точка входа из схемы ТЗ.

**Три стадии у каждого Dockerfile:** `development` (dev-сервер с watch/HMR),
`build` (компиляция), `production` (тонкий финальный образ). Прод-стек использует
`target: production`, dev-overlay — `target: development`.

---

## 2. Быстрый старт

```bash
# 1. Подготовить переменные окружения
cp .env.example .env
#    отредактировать пароли, JWT-секреты и при необходимости SITE_ADDRESS

# 2a. Прод-режим (сборка + фон)
docker compose up --build -d
#    открыть НАПРЯМУЮ https://localhost:8443
#    (заход на http://localhost:8080 отдаёт 308 на https://localhost/ — без :8443,
#     т.к. Caddy внутри знает только про порт 443 и не в курсе о ремапе хоста;
#     на нестандартном порту всегда открывать https://...:8443 руками)
#    сертификат localhost подписан внутренним CA Caddy — в браузере
#    один раз подтвердить доверие (или импортировать корень из тома caddy_data)

# 2b. Dev-режим (watch + HMR, монтирование исходников, HTTP)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
#    открыть http://localhost:8080
```

Требуется Docker Engine 24+ и Docker Compose v2 (`docker compose`, не `docker-compose`).
Директива `!override` в dev-overlay требует Compose ≥ 2.24.

### Реальный домен

```bash
# в .env
SITE_ADDRESS=reports.example.com
HTTP_PORT=80
HTTPS_PORT=443
```

Домен должен резолвиться на сервер, порты 80/443 — открыты наружу. Caddy сам
получит и будет продлевать сертификат. Состояние ACME лежит в томе
`meeymirita_caddy_data` — его нельзя терять (иначе повторные запросы упрутся в
лимиты Let's Encrypt).

---

## 3. `.env.example`

**Путь:** `./.env.example`

```dotenv
# ── PostgreSQL ───────────────────────────────────────────────
POSTGRES_DB=reports
POSTGRES_USER=mira
POSTGRES_PASSWORD=change_me_in_prod
POSTGRES_PORT=5432

# ── Backend (NestJS) ─────────────────────────────────────────
NODE_ENV=production
BACKEND_PORT=3000
DATABASE_URL=postgresql://mira:change_me_in_prod@postgres:5432/reports
JWT_SECRET=replace_with_long_random_string
JWT_REFRESH_SECRET=replace_with_another_long_random_string
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d

# ── Точка входа (Caddy, HTTPS автоматически) ─────────────────
SITE_ADDRESS=localhost
HTTP_PORT=8080
HTTPS_PORT=8443

# ── Прочее ───────────────────────────────────────────────────
TZ=Europe/Moscow
```

### Пояснение

| Переменная | Назначение |
| --- | --- |
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` | Учётные данные, с которыми официальный образ `postgres` создаёт БД при первом запуске (пока том пуст). |
| `POSTGRES_PORT` | Порт **хоста**, проброшенный на `5432` контейнера. Внутри сети compose сервисы обращаются к `postgres:5432`. |
| `NODE_ENV` | `production` в прод-стеке; dev-overlay принудительно ставит `development`. |
| `BACKEND_PORT` | Порт хоста для прямого доступа к API в обход Caddy (Postman, отладка). |
| `DATABASE_URL` | Готовая строка подключения для TypeORM/Prisma. Хост — `postgres` (имя сервиса = DNS-имя в сети compose). |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Секреты подписи access/refresh токенов (ТЗ п. 3.1). В проде — длинные случайные строки, не коммитить. |
| `JWT_ACCESS_TTL` / `JWT_REFRESH_TTL` | Время жизни токенов. |
| `SITE_ADDRESS` | Адрес, который обслуживает Caddy. `localhost` → внутренний CA (локальный HTTPS). Реальный домен → сертификат по ACME. |
| `HTTP_PORT` | Порт хоста на `:80` Caddy — там HTTP, который редиректит на HTTPS, и проходит ACME-челлендж. |
| `HTTPS_PORT` | Порт хоста на `:443` Caddy — **основная точка входа** (SPA + `/api`). |
| `TZ` | Единый часовой пояс для контейнеров (ТЗ п. 7: хранить UTC, показывать в TZ компании). |

Все переменные в compose заданы как `${VAR:-default}` — стек поднимется и без
`.env`, но с небезопасными дефолтами. `.env` в git не попадает (`.gitignore`).

---

## 4. `backend/Dockerfile`

**Путь:** `./backend/Dockerfile`

```dockerfile
# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache dumb-init
RUN npm i -g npm@11
ENV TZ=Europe/Moscow

FROM base AS deps
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

FROM deps AS development
ENV NODE_ENV=development
COPY . .
EXPOSE 3000
CMD ["dumb-init", "npm", "run", "start:dev"]

FROM deps AS build
ENV NODE_ENV=production
COPY . .
RUN npm run build \
 && npm prune --omit=dev

FROM base AS production
ENV NODE_ENV=production
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./
USER node
EXPOSE 3000
CMD ["dumb-init", "node", "dist/main"]
```

### Пояснение

**`# syntax=docker/dockerfile:1`** — актуальный синтаксис BuildKit, в частности
`RUN --mount=type=cache`.

**Стадия `base`**
- `FROM node:22-alpine` — лёгкий образ (~50 МБ) с Node 22. Nest 11 требует Node ≥ 20.
- `WORKDIR /app` — рабочая директория для всех последующих команд.
- `apk add --no-cache dumb-init` — крохотный init-процесс (PID 1). Node сам по себе
  не пробрасывает сигналы дочерним процессам и игнорирует `SIGTERM` → `docker stop`
  ждёт 10 с и убивает контейнер. `dumb-init` это чинит (graceful shutdown).
- `npm i -g npm@11` — образ несёт npm 10.9, а `package-lock.json` пишется локальным
  npm 11+. Без апгрейда `npm ci` падает с `EUSAGE` на конфликте `chokidar` в дереве
  `@nestjs-modules/mailer` (mjml/nunjucks хотят `chokidar@3`, npm 11 деупает `4`).
- `ENV TZ=Europe/Moscow` — часовой пояс внутри контейнера.

**Стадия `deps`** — изолированная установка зависимостей.
- `apk add python3 make g++` — тулчейн `node-gyp`: у `argon2` нет prebuild под
  musl (Alpine), нативный модуль собирается из исходников. В `production` не тянется.
- Копируются **только** `package.json` и `package-lock.json`. Пока они не менялись,
  Docker берёт слой из кэша и `npm ci` повторно не выполняется, даже если поменялся код.
- `npm ci` — детерминированная установка строго по lock-файлу.
- `--mount=type=cache,target=/root/.npm` — кэш скачанных пакетов npm живёт между
  сборками, но не попадает в образ.
- Ставятся **все** зависимости, включая dev (`@nestjs/cli`, `typescript`, `prisma`) — нужны для компиляции.

**Стадия `development`** — для `docker-compose.dev.yml`.
- `NODE_ENV=development`; `COPY . .` — код в образ (в dev поверх монтируется bind-mount).
- `CMD … npm run start:dev` → `nest start --watch`: пересборка и перезапуск при изменении файлов.

**Стадия `build`** — компиляция.
- `npm run build` → `nest build` → транспиляция TS в `dist/` (`dist/main.js`).
- `npm prune --omit=dev` — из `node_modules` удаляются dev-зависимости, остаётся
  только рантайм; этот каталог затем копируется в финальный образ.

**Стадия `production`** — финальный образ, идёт от чистого `base`.
- Копируются три вещи: обрезанный `node_modules`, скомпилированный `dist`, `package.json`.
- `--chown=node:node` + `USER node` — контейнер работает под непривилегированным пользователем.
- `CMD ["dumb-init", "node", "dist/main"]` — запуск; `main.ts` слушает `process.env.PORT ?? 3000`.

Итог: в рантайм-образе нет исходников TS, компилятора и dev-зависимостей.

---

## 5. `backend/.dockerignore`

**Путь:** `./backend/.dockerignore`

```gitignore
node_modules
dist
coverage
.git
.gitignore
.gitattributes
Dockerfile
.dockerignore
.env
.env.*
.idea
.vscode
*.log
npm-debug.log*
*.md
```

### Пояснение

Список того, что **не** отправляется демону Docker как build-контекст (контекст для
backend — папка `./backend`).

- `node_modules` — ставится внутри образа через `npm ci`; локальная сборка под
  macOS/arm в linux-контейнере может быть несовместима. Плюс сотни МБ.
- `dist` — артефакт сборки, создаётся в стадии `build`.
- `coverage`, `*.log` — отчёты и логи, в образе не нужны.
- `.git`, `.gitignore`, `.gitattributes` — история и метаданные VCS.
- `.env`, `.env.*` — **секреты не должны попадать в образ**; переменные
  прокидываются через compose в рантайме.
- `Dockerfile`, `.dockerignore` — сам рецепт сборки внутри образа не нужен.
- `.idea`, `.vscode` — настройки IDE.
- `*.md` — документация, на рантайм не влияет.

Меньше контекст → быстрее `docker build` и чище кэш слоёв.

---

## 6. `frontend/Dockerfile`

**Путь:** `./frontend/Dockerfile`

```dockerfile
# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app
ENV TZ=Europe/Moscow

FROM base AS deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

FROM deps AS development
ENV NODE_ENV=development
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

FROM deps AS build
ENV NODE_ENV=production
COPY . .
RUN npm run build-only

FROM caddy:2-alpine AS production
ENV TZ=Europe/Moscow
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
EXPOSE 80 443
# admin-API Caddy слушает 127.0.0.1:2019 (IPv4) — адрес указываем явно,
# иначе busybox wget уходит в ::1 и получает Connection refused
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --start-interval=3s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:2019/config/ || exit 1
```

### Пояснение

**Стадии `base` / `deps`** — аналогично backend: Node 22 Alpine, отдельный
кэшируемый слой зависимостей, `npm ci` по lock-файлу. `package.json` требует
Node `^22.18 || >=24.12` — тег `node:22-alpine` этому удовлетворяет.

**Стадия `development`**
- `CMD npm run dev -- --host 0.0.0.0` — dev-сервер Vite слушает на всех интерфейсах
  (иначе изнутри контейнера недоступен). `EXPOSE 5173` — дефолтный порт Vite.
- В `docker-compose.dev.yml` команда переопределяется на `--port 80`.

**Стадия `build`**
- `npm run build-only` → `vite build` → статика в `dist/` (`index.html` + `assets/*.[hash].js|css`).
- Используется `build-only`, а не `build`, потому что полный `build` дополнительно
  запускает `vue-tsc` (проверку типов) — в контейнере сборки это лишнее и хрупкое;
  типы проверяются отдельным шагом CI (`npm run type-check`).

**Стадия `production`** — образ на базе `caddy:2-alpine`.
- `COPY Caddyfile /etc/caddy/Caddyfile` — наш конфиг (SPA + прокси `/api` + TLS).
  Путь `/etc/caddy/Caddyfile` — то, что базовый образ Caddy читает по умолчанию.
  Поэтому `Caddyfile` **не** внесён в `.dockerignore`.
- `COPY --from=build /app/dist /srv` — только собранная статика (в Caddyfile
  `root * /srv`). Ни Node, ни node_modules в финальном образе нет.
- `EXPOSE 80 443` — HTTP (редирект + ACME) и HTTPS.
- `HEALTHCHECK` — `wget` дёргает локальный admin-API Caddy на `127.0.0.1:2019`
  (он всегда слушает внутри контейнера, но только на IPv4 — поэтому адрес задан
  явно, не `localhost`): первые 10 с (`start-period`) проверки не считаются
  фатальными и идут чаще (`start-interval=3s`) для быстрого перехода в `healthy`,
  дальше — раз в 30 с; при 3 неудачах подряд контейнер помечается `unhealthy`.
  `caddy:alpine` содержит `wget` (busybox).
- Команда запуска берётся из базового образа: `caddy run --config /etc/caddy/Caddyfile`.

---

## 7. `frontend/Caddyfile`

**Путь:** `./frontend/Caddyfile`

```caddy
{$SITE_ADDRESS:localhost} {
	encode zstd gzip

	handle_path /api/* {
		reverse_proxy backend:3000
	}

	handle {
		root * /srv
		try_files {path} /index.html
		file_server
	}

	@assets path /assets/*
	header @assets Cache-Control "public, max-age=31536000, immutable"

	log {
		output stdout
		format console
	}
}
```

### Пояснение

- **`{$SITE_ADDRESS:localhost}`** — адрес сайта берётся из переменной окружения
  (передаётся из compose), по умолчанию `localhost`. Именно от этого значения
  Caddy решает, какой сертификат выпускать:
  - `localhost` / IP → встроенный локальный CA, сертификат доверенный на этой машине;
  - публичный домен → ACME (Let's Encrypt, при неудаче ZeroSSL), автопродление.

  Отдельного `tls`-блока не нужно — HTTPS «из коробки». HTTP-порт при этом
  автоматически отдаёт 308-редирект на HTTPS.
- **`encode zstd gzip`** — сжатие ответов; клиенту с поддержкой zstd отдаётся zstd, иначе gzip.
- **`handle_path /api/* { reverse_proxy backend:3000 }`** — прокси на API.
  `handle_path` (в отличие от `handle`) **срезает** совпавший префикс:
  `/api/auth/login` уходит на `http://backend:3000/auth/login` (эндпоинты из
  п. 5 ТЗ — без `/api`). `backend` резолвится через DNS сети compose. Caddy сам
  проставляет `X-Forwarded-For` / `X-Forwarded-Proto` и умеет WebSocket.
- **`handle { … }`** — всё, что не `/api/*`:
  - `root * /srv` — корень статики (туда стадия `production` кладёт `dist`).
  - `try_files {path} /index.html` — SPA-fallback: есть файл — отдаём его, нет —
    `index.html`, дальше маршрут разбирает `vue-router` (`createWebHistory`).
    Без этого прямой заход на `/reports/weekly` дал бы 404.
  - `file_server` — собственно отдача файлов с диска.
- **`@assets path /assets/*` + `header … Cache-Control … immutable`** — файлы Vite
  содержат хэш в имени и меняют его при изменении контента, поэтому кэшируются на год.
- **`log { output stdout; format console }`** — логи доступа в stdout
  человекочитаемо, собираются через `docker compose logs frontend`.

> Почтовый адрес для ACME не задан — для `localhost` он не нужен, для публичного
> домена Caddy обойдётся без аккаунта. Чтобы указать явно, добавьте глобальный
> блок в начало файла: `{ email you@example.com }`.

---

## 8. `frontend/.dockerignore`

**Путь:** `./frontend/.dockerignore`

```gitignore
node_modules
dist
dist-ssr
coverage
playwright-report
test-results
.git
.gitignore
.gitattributes
Dockerfile
.dockerignore
.env
.env.*
.idea
.vscode
*.local
*.log
npm-debug.log*
*.md
```

### Пояснение

То же, что и для backend, с поправками на фронтенд-стек:

- `dist`, `dist-ssr` — сборка Vite (делается внутри образа).
- `playwright-report`, `test-results` — артефакты e2e-тестов Playwright.
- `*.local` — локальные `.env.*.local` и подобные.
- **`Caddyfile` в списке отсутствует намеренно** — он копируется в образ на стадии
  `production` (`COPY Caddyfile /etc/caddy/Caddyfile`).

---

## 9. `.dockerignore` (корень)

**Путь:** `./.dockerignore`

```gitignore
**/node_modules
**/dist
**/coverage
.git
.idea
.vscode
**/*.log
**/.env
**/.env.*
```

### Пояснение

Сервисные образы собираются с контекстами `./backend` и `./frontend`, у каждого
свой `.dockerignore`. Корневой файл задействуется только при сборке с **корневым**
контекстом — сейчас таких сборок нет, файл оставлен на будущее (общий образ для CI)
и чтобы случайная `docker build .` в корне не утянула `node_modules` и `.env`
обоих проектов. Шаблоны с `**/` действуют на любой вложенности.

---

## 10. `docker-compose.yml`

**Путь:** `./docker-compose.yml`

```yaml
name: meeymirita-feedback-platform-klite

services:
  postgres:
    image: postgres:16-alpine
    container_name: meeymirita-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-reports}
      POSTGRES_USER: ${POSTGRES_USER:-mira}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-mira}
      TZ: ${TZ:-Europe/Moscow}
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    volumes:
      - meeymirita_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-mira} -d ${POSTGRES_DB:-reports}"]
      interval: 5s
      timeout: 5s
      retries: 10
    networks: [meeymirita-net]

  redis:
    image: redis:7-alpine
    container_name: meeymirita-redis
    restart: unless-stopped
    command: ["redis-server", "--appendonly", "yes"]
    ports:
      - "${REDIS_PORT:-6379}:6379"
    volumes:
      - meeymirita_redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 10
    networks: [meeymirita-net]

  backend:
    build:
      context: ./backend
      target: production
    image: meeymirita/feedback-klite-backend:latest
    container_name: meeymirita-backend
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      NODE_ENV: ${NODE_ENV:-production}
      PORT: 3000
      TZ: ${TZ:-Europe/Moscow}
      DATABASE_URL: ${DATABASE_URL:-postgresql://mira:mira@postgres:5432/reports}
      POSTGRES_HOST: postgres
      POSTGRES_PORT: 5432
      POSTGRES_DB: ${POSTGRES_DB:-reports}
      POSTGRES_USER: ${POSTGRES_USER:-mira}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-mira}
      REDIS_URL: ${REDIS_URL:-redis://redis:6379}
      REDIS_HOST: redis
      REDIS_PORT: 6379
      COOKIES_SECRET: ${COOKIES_SECRET:-dev_insecure_cookies_change_me}
      SESSION_SECRET: ${SESSION_SECRET:-dev_insecure_session_change_me}
      SESSION_TTL: ${SESSION_TTL:-86400}
      JWT_SECRET: ${JWT_SECRET:-dev_insecure_secret_change_me}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET:-dev_insecure_refresh_change_me}
      JWT_ACCESS_TTL: ${JWT_ACCESS_TTL:-15m}
      JWT_REFRESH_TTL: ${JWT_REFRESH_TTL:-7d}
      MAIL_HOST: ${MAIL_HOST:-}
      MAIL_PORT: ${MAIL_PORT:-587}
      MAIL_USER: ${MAIL_USER:-}
      MAIL_PASSWORD: ${MAIL_PASSWORD:-}
      MAIL_FROM: ${MAIL_FROM:-}
      RECAPTCHA_SECRET_KEY: ${RECAPTCHA_SECRET_KEY:-}
    ports:
      - "${BACKEND_PORT:-3000}:3000"
    init: true
    networks: [meeymirita-net]

  frontend:
    build:
      context: ./frontend
      target: production
    image: meeymirita/feedback-klite-frontend:latest
    container_name: meeymirita-frontend
    restart: unless-stopped
    depends_on:
      - backend
    environment:
      SITE_ADDRESS: ${SITE_ADDRESS:-localhost}
      TZ: ${TZ:-Europe/Moscow}
    ports:
      - "${HTTP_PORT:-8080}:80"
      - "${HTTPS_PORT:-8443}:443"
    volumes:
      - meeymirita_caddy_data:/data
      - meeymirita_caddy_config:/config
    networks: [meeymirita-net]

volumes:
  meeymirita_pgdata:
  meeymirita_redisdata:
  meeymirita_caddy_data:
  meeymirita_caddy_config:

networks:
  meeymirita-net:
    driver: bridge
```

### Пояснение

**`name:`** — фиксированное имя проекта (префикс `meeymirita`). От него Docker
образует имена сети и томов по умолчанию; здесь они заданы явно.

#### Сервис `postgres`
- `image: postgres:16-alpine` — версия зафиксирована (не `latest`), чтобы мажорный
  апгрейд Postgres не сломал том с данными.
- `container_name: meeymirita-postgres` — предсказуемое имя для `docker exec`/логов.
- `restart: unless-stopped` — поднимать после перезагрузки хоста/падения, но не
  после ручного `docker stop`.
- `environment` — БД/пользователь/пароль из `.env` (дефолты `mira`).
- `ports: "${POSTGRES_PORT:-5432}:5432"` — доступ к БД с хоста (psql, DBeaver).
  В проде строку можно убрать — сервисам БД видна по сети compose.
- `volumes: meeymirita_pgdata:/var/lib/postgresql/data` — данные в именованном
  томе, переживают пересоздание контейнера.
- `healthcheck: pg_isready …` — БД считается готовой, только когда реально
  принимает подключения; от этого зависит старт backend.

#### Сервис `redis`
- `image: redis:7-alpine` — хранилище сессий (`express-session` + `connect-redis`).
- `command: redis-server --appendonly yes` — включён AOF-персист: сессии
  переживают перезапуск контейнера.
- `volumes: meeymirita_redisdata:/data` — том под дамп AOF.
- `healthcheck: redis-cli ping` — `redis` считается готовым по ответу `PONG`;
  от этого зависит старт backend.
- `ports: "${REDIS_PORT:-6379}:6379"` — доступ с хоста (redis-cli, GUI). В проде
  можно убрать.

#### Сервис `backend`
- `build.context: ./backend`, `build.target: production` — собирается прод-стадия
  из [`backend/Dockerfile`](#4-backenddockerfile).
- `image: …-backend:latest` — имя собранного образа (удобно пушить в реестр).
- `depends_on` — backend стартует **после** того, как `postgres` **и** `redis`
  стали `healthy` (по их healthcheck'ам), а не просто «контейнер запущен».
- `environment`:
  - `PORT: 3000` — на нём слушает Nest (`main.ts`).
  - `DATABASE_URL` + отдельные `POSTGRES_*` — для Prisma; хост БД — `postgres`
    (имя сервиса).
  - `REDIS_URL` / `REDIS_HOST` / `REDIS_PORT` — подключение к Redis; хост — `redis`.
  - `COOKIES_SECRET` — подпись cookie (`cookie-parser`).
  - `SESSION_SECRET` / `SESSION_TTL` — секрет и время жизни сессии (`express-session`).
  - `MAIL_*` — SMTP для `@nestjs-modules/mailer`; `RECAPTCHA_SECRET_KEY` — для
    `@nestlab/google-recaptcha`. Пустые по умолчанию.
  - `JWT_*` — оставлены на случай, если понадобится вдобавок к сессиям.
- `ports: "${BACKEND_PORT:-3000}:3000"` — прямой доступ к API в обход Caddy
  (Swagger, Postman). Для чистого прода можно убрать.
- `init: true` — Docker подкладывает свой init (PID 1) для реапинга зомби-процессов
  (в дополнение к `dumb-init` в образе).

#### Сервис `frontend`
- Собирает прод-стадию из [`frontend/Dockerfile`](#6-frontenddockerfile) — Caddy
  со статикой.
- `depends_on: [backend]` — порядок старта (без ожидания healthcheck; Caddy
  переживёт временно недоступный upstream).
- `environment.SITE_ADDRESS` — прокидывается в [`Caddyfile`](#7-frontendcaddyfile);
  определяет домен и тип сертификата.
- `ports`:
  - `"${HTTP_PORT:-8080}:80"` — HTTP: редирект на HTTPS и HTTP-01 ACME-челлендж.
  - `"${HTTPS_PORT:-8443}:443"` — **основная точка входа**: `https://localhost:8443`
    → SPA, `/api/*` → backend.
- `volumes`:
  - `meeymirita_caddy_data:/data` — сертификаты, ключи аккаунта ACME, OCSP-стейплинг.
    **Терять нельзя**: потеря = повторный выпуск сертификатов и риск упереться в
    лимиты Let's Encrypt.
  - `meeymirita_caddy_config:/config` — автосохранённая (нормализованная) конфигурация Caddy.

**`volumes:`** верхнего уровня — объявление трёх именованных томов
(`pgdata`, `caddy_data`, `caddy_config`). Удаляются только явно: `docker compose down -v`.

**`networks.meeymirita-net`** — общая bridge-сеть; сервисы видят друг друга по
именам (`postgres`, `backend`, `frontend`).

---

## 11. `docker-compose.dev.yml`

**Путь:** `./docker-compose.dev.yml`

```yaml
services:
  backend:
    build:
      target: development
    image: meeymirita/feedback-klite-backend:dev
    environment:
      NODE_ENV: development
    volumes:
      - ./backend:/app
      - meeymirita_backend_node_modules:/app/node_modules

  frontend:
    build:
      target: development
    image: meeymirita/feedback-klite-frontend:dev
    environment:
      NODE_ENV: development
    command: ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "80"]
    ports: !override
      - "${HTTP_PORT:-8080}:80"
    volumes:
      - ./frontend:/app
      - meeymirita_frontend_node_modules:/app/node_modules

volumes:
  meeymirita_backend_node_modules:
  meeymirita_frontend_node_modules:
```

### Пояснение

Overlay-файл: накладывается поверх `docker-compose.yml` и переопределяет только
нужные поля. Запуск:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Файл называется `docker-compose.dev.yml`, а **не** `docker-compose.override.yml`,
намеренно — иначе Compose подхватывал бы его автоматически при каждом
`docker compose up`, и прод-режим было бы не запустить без лишних флагов.

- **`build.target: development`** — вместо прод-стадии собирается стадия
  `development` (dev-сервер, watch/HMR, dev-зависимости внутри).
- **`image: …:dev`** — отдельный тег, чтобы dev-образ не перезатирал `:latest`.
- **`NODE_ENV: development`** — переопределяет прод-значение из базового файла.
- **`volumes: ./backend:/app`** (и `./frontend:/app`) — bind-mount: исходники с
  хоста монтируются в контейнер, правки видны мгновенно, `nest --watch` /
  Vite HMR перезапускают/обновляют без пересборки образа.
- **`meeymirita_*_node_modules:/app/node_modules`** — именованный том поверх точки
  монтирования. Без него bind-mount перекрыл бы `/app/node_modules` из образа
  пустой хостовой папкой; так внутри остаются зависимости из сборки.
- **`command` у `frontend`** — Vite слушает `:80` внутри контейнера, чтобы совпасть
  с пробросом `${HTTP_PORT:-8080}:80`. То есть в dev приложение открывается на
  `http://localhost:8080` с HMR. `backend` порт наследует от базового файла (`3000:3000`).
- **`ports: !override`** — тег Compose, который **заменяет** список портов из
  базового файла, а не дополняет его (по умолчанию порты конкатенируются). Нужен,
  чтобы в dev не тащился неиспользуемый проброс `:443` (в dev нет Caddy/TLS —
  только Vite по HTTP). Требует Compose ≥ 2.24.
- **`volumes:`** верхнего уровня — объявление двух томов под node_modules;
  `meeymirita_pgdata` / `caddy_*` подмешиваются из базового файла автоматически.

Что **не** меняется: `postgres` (та же БД и том), сеть, healthcheck, `depends_on`.

> **HTTPS в dev.** Dev-режим сознательно оставлен на HTTP: цель — быстрый цикл с
> HMR. Если нужен HTTPS локально — используйте прод-стек (`docker compose up
> --build`): Caddy отдаёт `https://localhost:8443` с доверенным на этой машине
> сертификатом. Пересборка занимает секунды за счёт кэша слоёв.

---

## 12. Частые команды

```bash
# ── Прод ────────────────────────────────────────────────────
docker compose up --build -d          # собрать и запустить в фоне
docker compose ps                     # статус сервисов
docker compose logs -f frontend       # логи Caddy (в т.ч. выпуск сертификата)
docker compose logs -f backend        # логи API
docker compose down                   # остановить и удалить контейнеры
docker compose down -v                # то же + УДАЛИТЬ тома (БД и сертификаты!)

# ── Dev ─────────────────────────────────────────────────────
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# ── Точечно ─────────────────────────────────────────────────
docker compose build backend          # пересобрать один образ
docker compose exec backend sh        # шелл внутри контейнера
docker compose exec postgres psql -U mira -d reports   # psql в БД
docker compose restart backend        # перезапуск сервиса

# ── Корневой сертификат Caddy (чтобы браузер доверял localhost) ──
docker compose cp frontend:/data/caddy/pki/authorities/local/root.crt ./caddy-root.crt
#   затем импортировать caddy-root.crt в доверенные корневые ЦС системы/браузера

# ── Проверка конфигурации ──────────────────────────────────
docker compose config                 # итоговый (смёрженный) compose
```

---

## 13. Траблшутинг

| Симптом | Причина / решение |
| --- | --- |
| `backend` рестартится с `ECONNREFUSED postgres:5432` | БД ещё поднимается. Обычно решает `depends_on: service_healthy`; иначе — `docker compose logs postgres`. |
| Порт `8443` / `8080` / `5432` занят | Поменять `HTTPS_PORT` / `HTTP_PORT` / `POSTGRES_PORT` в `.env`. |
| Браузер ругается на сертификат `localhost` | Ожидаемо: это внутренний CA Caddy. Принять один раз вручную либо импортировать `root.crt` (см. команду выше) в доверенные корневые ЦС. |
| Изменил код, но в контейнере старое | Прод-образ не следит за файлами — нужен `docker compose build`. Для live-правок — dev-overlay. |
| `502` / `Bad Gateway` на `/api/...` | `backend` не запущен или упал: `docker compose logs backend`. Caddy проксирует на `backend:3000`. |
| Пустая страница, 404 при перезагрузке на вложенном маршруте | Проверить блок `handle { try_files … /index.html }` в `Caddyfile` (SPA-fallback). |
| `http://localhost:8080` редиректит на `https://localhost/` и «не открывается» | Caddy отдаёт 308 на порт 443, про ремап хоста `8443:443` он не знает. Открывать `https://localhost:8443` (или `https://<SITE_ADDRESS>:8443`) напрямую. |
| В логах Caddy `Cannot issue for "…": Domain name needs at least one dot`, health висит `starting`/`unhealthy` | В `SITE_ADDRESS` указано голое слово без точки — Caddy принял его за публичный домен и ушёл в Let's Encrypt. Поставить `localhost`, `<имя>.localhost`, IP или настоящий FQDN; `docker compose up -d`. |
| `frontend` вечно `health: starting` → `unhealthy`, в healthcheck `Connection refused` на `:2019` | admin-API Caddy слушает только IPv4. В HEALTHCHECK адрес должен быть `127.0.0.1:2019`, не `localhost:2019` (уже исправлено). |
| Публичный домен: `could not get certificate` в логах Caddy | Домен не резолвится на сервер, либо порты 80/443 закрыты снаружи, либо упёрлись в rate limit Let's Encrypt. Проверить DNS и firewall; том `caddy_data` не удалять. |
| Пересобрал фронт, браузер показывает старое | Хэши ассетов сменились, но `index.html` мог закэшироваться — hard-reload. |
| Нужно начать БД с нуля | `docker compose down -v` удалит том `meeymirita_pgdata` (и `caddy_data`/`caddy_config` — сертификаты выпустятся заново). |
| `!override` не понимается Compose | Нужен Docker Compose ≥ 2.24. Проверить `docker compose version`. |
