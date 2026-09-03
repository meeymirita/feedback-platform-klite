# feedback-platform-klite

Мини-платформа для ежедневной и еженедельной отчётности сотрудников: сотрудник
фиксирует задачи за день (направление, ссылка, что сделал, время), а руководитель
(ADMIN / MIRA) видит недельный отчёт по каждому и сводку по всем.

**Статус:** `v1.0.0` — боевой релиз, одобрен заказчиком, развёрнут на VPS
(`meeymirita.ru`, Docker + Caddy). Дальнейшие улучшения — после этого тега.

**Стек:** Vue 3 + Pinia + Tailwind v4 · NestJS 11 · PostgreSQL 16 + Prisma 7 ·
Redis 7 (сессии) · Docker Compose · Caddy 2 (SPA + reverse-proxy + авто-TLS)

---

## Что умеет (v1.0.0)

| Раздел | Кто | Готово |
| --- | --- | --- |
| Вход по email/паролю, сессия в Redis | все | ✅ |
| Мои записи — CRUD задач за день | залогиненный | ✅ |
| Недельный отчёт — свои записи по дням недели | залогиненный | ✅ |
| Сотрудники — создание USER/ADMIN, правка роли/имени, сброс пароля | ADMIN / MIRA | ✅ |
| Сводный отчёт по всем за неделю + drill-down в отчёт сотрудника | ADMIN / MIRA | ✅ |
| Выгрузка в Excel | ADMIN / MIRA | ⏳ кнопки-заглушки, экспорт не реализован |
| Мобильная вёрстка | — | ⏳ только ПК |
| Автотесты | — | ⏳ нет |

**Регистрации нет** — аккаунты заводит ADMIN/MIRA. `MIRA` — единственный владелец,
создаётся сидом (`SEED_MIRA_*`), второго завести нельзя.

**Роли:** `USER` (свои записи + свой недельный отчёт), `ADMIN` (то же + сотрудники
+ сводка), `MIRA` (как ADMIN, неудаляем, один на систему).

Нюанс: роль в открытой сессии не меняется на лету — пользователь увидит новую роль
после релогина / F5.

---

## API

Все маршруты под `/api/v1`. Аутентификация — cookie-сессия (`express-session` +
`connect-redis`), не JWT. Пароль наружу не отдаётся никогда.

| Метод | Путь | Доступ | Назначение |
| --- | --- | --- | --- |
| `POST` | `/auth/login` | гость | вход → `{ user }`, единый `401` на неверный email или пароль |
| `POST` | `/auth/logout` | сессия | выход, чистит куку и ключ в Redis |
| `GET` | `/users/profile` | сессия | текущий пользователь, `401` без сессии |
| `GET` | `/users` | ADMIN / MIRA | список пользователей (без MIRA) |
| `POST` | `/users/create-user` | ADMIN / MIRA | создать USER или ADMIN |
| `PATCH` | `/users/:id` | ADMIN / MIRA | сменить `displayName` / роль (email неизменяем; цель-MIRA → 403) |
| `PATCH` | `/users/:id/password` | ADMIN / MIRA | сброс пароля |
| `GET` | `/report-entries?from&to` | сессия | свои записи за период |
| `POST` | `/report-entries` | сессия | создать запись (автор — из сессии) |
| `PATCH` | `/report-entries/:id` | сессия | правка своей записи |
| `DELETE` | `/report-entries/:id` | сессия | удаление своей записи |
| `GET` | `/reports/summary?from&to` | ADMIN / MIRA | сводка по всем сотрудникам за период |
| `GET` | `/reports/entries?userId&from&to` | ADMIN / MIRA | записи конкретного сотрудника (просмотр чужого отчёта) |

Недельные суммы считаются на лету из выборки записей — отдельной таблицы отчёта нет.

---

## Модель данных

```
User(id, email✱, password, displayName, role[USER|ADMIN|MIRA], createdAt, updatedAt)
ReportEntry(id, userId→User, date, domain, link, description, minutes, createdAt, updatedAt)
  onDelete: Cascade,  @@index([userId, date])
```

Схема накатывается через `prisma db push` (без миграций). Prisma 7: URL БД — не в
схеме, а в `prisma.config.ts` (CLI) и через `@prisma/adapter-pg` (рантайм).
Клиент генерится в `src/generated/prisma` (в git не коммитится).

---

## Структура репозитория

```
.
├── backend/                  — NestJS API (auth, user, report-entry)
│   ├── Dockerfile            — multi-stage: deps → development → build → migrate → production
│   ├── prisma/               — schema.prisma + seed.ts
│   └── .env.example
├── frontend/                 — Vue 3 SPA
│   ├── Dockerfile            — multi-stage: production на caddy:2-alpine
│   └── Caddyfile             — раздача SPA + прокси /api/* + авто-HTTPS
├── docker-compose.yml        — прод-стек: postgres + redis + backend + frontend + (профиль) migrate
├── docker-compose.dev.yml    — overlay для разработки (watch/HMR, bind-mount)
├── .env.example              — переменные для docker compose (корневой .env читает ТОЛЬКО compose)
├── DEPLOY.md
└── docs/
```

---

## Запуск

### Прод-стек локально (как на сервере)

```bash
cp .env.example .env          # заполнить пароли и секреты (openssl rand -hex 32)
                              # комментарии в .env — только на отдельной строке!

docker compose build
docker compose up -d postgres redis
docker compose run --rm migrate          # схема в БД + сид пользователя MIRA (идемпотентно)
docker compose up -d
#   → https://localhost:8443   (HTTP :8080 редиректит на HTTPS; внутренний CA Caddy)
```

Точка входа — контейнер **Caddy**: отдаёт собранный SPA, проксирует `/api/*` на
`backend:3000` (без среза префикса) и сам поднимает HTTPS. Домен и режим TLS
задаёт `SITE_ADDRESS`: `localhost`/`*.localhost`/IP → внутренний CA, реальный
домен → Let's Encrypt.

Боевой деплой на VPS — см. [`DEPLOY.md`](DEPLOY.md).

### Разработка (watch + HMR в контейнерах)

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
#   → http://localhost:8080   (Vite dev-server, без TLS; backend с авто-перезапуском)
```

### Разработка без Docker

```bash
# нужны запущенные Postgres и Redis:
docker compose up -d postgres redis

# backend
cd backend
cp .env.example .env          # заполнить, в т.ч. SEED_MIRA_* ; хосты — localhost
npm install
npx prisma db push && npx prisma generate && npm run seed
npm run start:dev             # http://localhost:3000

# frontend (в другом терминале)
cd frontend
npm install
npm run dev                   # http://localhost:5173, /api проксируется на :3000
```

> В Docker (`NODE_ENV=production`) backend `backend/.env` **не читает** — переменные
> приходят из блока `environment:` сервиса. `backend/.env` нужен только для
> `npm run start:dev` на хосте.

---

## Разработка: процесс

- Каждая фича — своя ветка; по готовности `git merge --no-ff` в `main` + push,
  ветки не удаляем.
- БД — `prisma db push`, миграций нет.
- Линт/формат: `npm run lint` / `npm run format` (backend), `npm run lint` (frontend).
