# feedback-platform-klite

Мини-платформа для ежедневной и еженедельной отчётности сотрудников: каждый
сотрудник фиксирует задачи за день (проект, ссылка, что сделал, время), а система
собирает их в недельный отчёт с выгрузкой в Excel.

**Стек:** Vue 3 + TypeScript · NestJS + TypeScript · PostgreSQL · Docker · Caddy

## Документация

| Файл | О чём |
| --- | --- |
| [`docs/TZ.md`](docs/TZ.md) | Техническое задание (исходный текст заказчика, v1.0) |
| [`docs/PLAN.md`](docs/PLAN.md) | **С чего начать** — пошаговый план разработки от скелета до MVP |
| [`docs/DOCKER.md`](docs/DOCKER.md) | Построчная документация по всем Docker-файлам |
| [`docs/DEPENDENCIES.md`](docs/DEPENDENCIES.md) | Все библиотеки проекта с версиями и назначением |
| [`docs/FRONTEND_STRUCTURE.md`](docs/FRONTEND_STRUCTURE.md) | Структура папок `frontend/src/` — что куда класть |

## Структура

```
.
├── backend/                 — NestJS API
│   ├── Dockerfile           — multi-stage: deps → development → build → production
│   └── .dockerignore
├── frontend/                — Vue 3 SPA
│   ├── Dockerfile           — multi-stage: production на caddy:2-alpine
│   ├── Caddyfile            — раздача SPA + прокси /api + авто-HTTPS
│   └── .dockerignore
├── docker-compose.yml       — прод-стек: postgres + backend + frontend (Caddy)
├── docker-compose.dev.yml   — overlay для разработки (watch/HMR, bind-mount)
├── .env.example             — образец переменных окружения
├── docs/                    — TZ, PLAN, DOCKER, DEPENDENCIES, FRONTEND_STRUCTURE
└── README.md
```

## Запуск в Docker

```bash
cp .env.example .env          # заполнить пароли и JWT-секреты

# Прод: postgres + backend (NestJS) + frontend (Caddy, HTTPS автоматически)
docker compose up --build -d
#   → https://localhost:8443            (HTTP :8080 редиректит на HTTPS)

# Разработка: авто-перезапуск backend, HMR фронта, исходники с хоста
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
#   → http://localhost:8080
```

Точка входа — контейнер **Caddy**: отдаёт собранный SPA, проксирует `/api/*` на
backend и сам поднимает HTTPS (внутренний CA для `localhost` / `*.localhost`,
Let's Encrypt для реального домена — через `SITE_ADDRESS` в `.env`).
Подробности и разбор каждого файла — в [`docs/DOCKER.md`](docs/DOCKER.md).

## Разработка без Docker

```bash
# backend
cd backend && npm install && npm run start:dev      # http://localhost:3000

# frontend
cd frontend && npm install && npm run dev           # http://localhost:5173
```

Нужен запущенный PostgreSQL (можно поднять только его: `docker compose up -d postgres`).
