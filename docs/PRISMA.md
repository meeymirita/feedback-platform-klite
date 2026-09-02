# Prisma: схема, клиент и пересборка БД

Как в `feedback-platform-klite` устроена работа с Prisma 7 и какими командами
приводить базу в соответствие со схемой.

- ORM: **Prisma 7.10** (`prisma`, `@prisma/client`, `@prisma/adapter-pg`)
- СУБД: **PostgreSQL 16** — контейнер `meeymirita-postgres` (см. [`DOCKER.md`](DOCKER.md))
- Схема: `backend/prisma/schema.prisma`
- Конфиг CLI: `backend/prisma.config.ts`
- Сгенерированный клиент: `backend/src/generated/prisma/` (коммитится в репозиторий)
- **Миграций нет** — синхронизация схемы идёт через `prisma db push`

---

## Оглавление

1. [Как всё связано](#1-как-всё-связано)
2. [Где какой URL базы](#2-где-какой-url-базы)
3. [Полная пересборка БД под схему](#3-полная-пересборка-бд-под-схему)
4. [Регенерация клиента](#4-регенерация-клиента)
5. [Согласие AI-агента на `--force-reset`](#5-согласие-ai-агента-на---force-reset)
6. [Прочие команды](#6-прочие-команды)
7. [Переход на миграции (если понадобится)](#7-переход-на-миграции-если-понадобится)
8. [Траблшутинг](#8-траблшутинг)

---

## 1. Как всё связано

```
backend/prisma/schema.prisma
├── generator client { provider = "prisma-client", output = "../src/generated/prisma", moduleFormat = "cjs" }
│        │  prisma generate
│        ▼
│   backend/src/generated/prisma/**   ← TS-исходники клиента (импортит код, коммитятся)
│
└── datasource db { provider = "postgresql" }   ← URL в схеме НЕ задан (Prisma 7)
         │
         ├── CLI (db push / migrate):  URL берётся из backend/prisma.config.ts
         │        └── prisma.config.ts → dotenv+expand читает backend/.env → process.env.POSTGRES_URI
         │
         └── рантайм (NestJS):  backend/src/prisma/prisma.service.ts
                  new PrismaClient({ adapter: new PrismaPg({ connectionString: POSTGRES_URI }) })
```

Ключевые следствия:

- `generator client` использует **новый провайдер `prisma-client`** (не `prisma-client-js`):
  клиент — это обычные `.ts`-файлы в `src/generated/prisma/`, а не пакет в `node_modules/.prisma`.
  Поэтому его **видно в git** и он пересоздаётся командой `prisma generate`.
- `moduleFormat = "cjs"` — потому что NestJS собирается в CommonJS (в `package.json` нет `"type": "module"`).
- URL базы в `schema.prisma` отсутствует намеренно (Prisma 7). CLI и рантайм берут его
  из разных мест, но значение одно — `POSTGRES_URI` из `backend/.env`.

---

## 2. Где какой URL базы

`backend/.env`:

```env
POSTGRES_USER="root"
POSTGRES_PASSWORD="123456"
POSTGRES_HOST="localhost"
POSTGRES_PORT=5433
POSTGRES_DB="full-authorization"
POSTGRES_URI="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}"
```

| Откуда запускаем | Хост:порт базы | Комментарий |
| --- | --- | --- |
| **с хоста** (`cd backend && npx prisma …`) | `localhost:5433` | порт проброшен из контейнера `postgres` в `docker-compose.yml` |
| **изнутри контейнера backend** | `postgres:5432` | имя сервиса compose; так ходит рантайм в проде |

`prisma.config.ts` подключает `dotenv` + `dotenv-expand` вручную (Prisma 7 сам `.env` не грузит),
поэтому `${...}` в `POSTGRES_URI` корректно разворачивается. CLI-команды ниже рассчитаны
на запуск **с хоста из папки `backend/`**.

---

## 3. Полная пересборка БД под схему

Основной сценарий: изменил `schema.prisma` → хочешь чистую базу строго по схеме.

```bash
cd backend
npx prisma db push --force-reset
```

Что делает:

- `--force-reset` — дропает схему `public` целиком и создаёт заново;
- затем накатывает текущий `schema.prisma` (таблицы `User`, `Account`, `Token`, энумы `UserRole`, `AuthMethod`, `TokenType`);
- **все данные теряются безвозвратно.** Только для dev-базы.

Без сброса (например, добавил необязательное поле и хочешь сохранить данные):

```bash
cd backend
npx prisma db push
```

Prisma сама скажет, если изменение нельзя применить без потери данных, и предложит `--force-reset` / `--accept-data-loss`.

> `db push` при провайдере `prisma-client` **не** запускает `generate` автоматически —
> клиент регенерируем отдельно, см. ниже.

### Снести и сам том Postgres

Если нужно вычистить не только схему, но и весь volume:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
docker volume rm meeymirita-feedback-platform-klite_meeymirita_pgdata
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres
cd backend && npx prisma db push && npx prisma generate
```

---

## 4. Регенерация клиента

```bash
cd backend
npx prisma generate
```

- читает `schema.prisma`, перезаписывает `src/generated/prisma/**` (файлы `client.ts`, `models/`, `enums.ts`, `internal/` …);
- запускать после **любого** изменения схемы, иначе типы и рантайм-клиент разъедутся с БД;
- результат коммитим вместе с изменением `schema.prisma`.

Backend в dev идёт под `nest start --watch` — обычно подхватывает новые файлы сам.
Если нет — перезапусти контейнер: `docker restart meeymirita-backend`.

---

## 5. Согласие AI-агента на `--force-reset`

Prisma 7 распознаёт запуск из-под AI-агента (Claude Code и т.п.) и **блокирует**
деструктивные команды (`db push --force-reset`, `migrate reset`, `migrate dev` с дрейфом):

```
Error: Prisma Migrate detected that it was invoked by Claude Code.
You are attempting a highly dangerous action …
```

Чтобы агент мог выполнить команду, нужно **явное подтверждение пользователя**, после чего
команда повторяется с переменной окружения, где значение — дословный текст согласия:

```bash
PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="да" npx prisma db push --force-reset
```

При ручном запуске (не через агента) переменная не нужна.

---

## 6. Прочие команды

Все — из папки `backend/`.

| Команда | Назначение |
| --- | --- |
| `npx prisma validate` | проверить синтаксис `schema.prisma` |
| `npx prisma format` | отформатировать схему |
| `npx prisma db push` | синхронизировать БД со схемой без сброса |
| `npx prisma db push --force-reset` | пересоздать БД с нуля по схеме (потеря данных) |
| `npx prisma generate` | пересобрать клиент в `src/generated/prisma/` |
| `npx prisma studio` | web-GUI по данным на `localhost:5555` |
| `npx prisma db pull` | втянуть схему из существующей БД в `schema.prisma` |
| `npx prisma --version` | версии CLI / клиента / движка |

Сидов сейчас нет: после `--force-reset` база пустая, тестовые данные заводим вручную
(регистрация через API либо `prisma studio`).

---

## 7. Переход на миграции (если понадобится)

Сейчас истории миграций нет (`prisma/migrations/` отсутствует). Когда схема стабилизируется,
можно перейти на версионируемые миграции:

```bash
cd backend
npx prisma migrate dev --name init      # создаст prisma/migrations/ + первую миграцию + regenerate
```

Дальше:

- изменение схемы → `npx prisma migrate dev --name <что_поменял>`;
- полный сброс dev-базы по миграциям → `npx prisma migrate reset`;
- применение на проде → `npx prisma migrate deploy`.

`prisma.config.ts` уже указывает путь `migrations: { path: 'prisma/migrations' }`, менять его не нужно.
После перехода на миграции `db push` в обычном цикле больше не используем.

---

## 8. Траблшутинг

| Симптом | Причина / решение |
| --- | --- |
| `Can't reach database server at postgres:5432` при запуске с хоста | взят внутренний URL. Проверь, что `POSTGRES_HOST=localhost`, `POSTGRES_PORT=5433` в `backend/.env`, а контейнер `meeymirita-postgres` поднят |
| `Environment variable not found: POSTGRES_URI` | запускаешь не из `backend/` либо `.env` не на месте — `prisma.config.ts` грузит `backend/.env` относительно себя |
| `Prisma Migrate detected that it was invoked by …` | см. [§5](#5-согласие-ai-агента-на---force-reset) |
| типы `@/generated/prisma/client` не совпадают с БД | забыл `npx prisma generate` после правки схемы |
| правки клиента не видны в контейнере | `docker restart meeymirita-backend`; при добавлении npm-пакета — переустановить внутри dev-контейнера (см. [`DOCKER.md`](DOCKER.md), named-volume поверх bind-mount) |
| `prisma studio` не открывается | порт 5555 занят или backend не нужен — Studio ходит в БД напрямую по `POSTGRES_URI` |
