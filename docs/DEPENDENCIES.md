# Библиотеки проекта

Полный список зависимостей `feedback-platform-klite` с версиями и назначением.

- **Источник истины по версиям** — `backend/package.json` / `frontend/package.json`
  (диапазоны semver) и `*-lock.json` (точные версии). Ниже — как в `package.json`.
- Проверить фактически установленное: `npm ls --depth=0` в каждой папке.
- Оба пакета — приватные (`"private": true`), не публикуются в npm.

---

## Оглавление

1. [Образы Docker](#1-образы-docker)
2. [Backend — рантайм](#2-backend--рантайм)
3. [Backend — разработка](#3-backend--разработка)
4. [Frontend — рантайм](#4-frontend--рантайм)
5. [Frontend — разработка](#5-frontend--разработка)
6. [Запланировано по ТЗ, ещё не установлено](#6-запланировано-по-тз-ещё-не-установлено)

---

## 1. Образы Docker

| Образ | Где используется | Назначение |
| --- | --- | --- |
| `node:22-alpine` | `backend/Dockerfile`, `frontend/Dockerfile` | Node 22 LTS на Alpine — сборка и рантайм backend, сборка статики frontend. Движок frontend требует `^22.18 || >=24.12`. |
| `postgres:16-alpine` | `docker-compose.yml` | СУБД PostgreSQL 16 (ТЗ). Версия зафиксирована, чтобы мажорный апгрейд не сломал том данных. |
| `redis:7-alpine` | `docker-compose.yml` | Хранилище сессий (`express-session` + `connect-redis`). `--appendonly yes` + том `meeymirita_redisdata` — сессии переживают перезапуск. |
| `caddy:2-alpine` | `frontend/Dockerfile` (стадия `production`) | Веб-сервер: раздача SPA, реверс-прокси на `/api`, автоматический HTTPS (внутренний CA для `localhost`, ACME для домена). |

---

## 2. Backend — рантайм

`backend/package.json` → `dependencies`. Попадают в продакшн-образ.

### Ядро NestJS

| Пакет | Версия | Назначение |
| --- | --- | --- |
| `@nestjs/common` | `^11.0.1` | Ядро NestJS: декораторы, DI-контейнер, пайпы, гварды, интерсепторы, фильтры исключений. |
| `@nestjs/core` | `^11.0.1` | Исполняющее ядро: построение графа модулей, жизненный цикл приложения, роутинг-резолвер. |
| `@nestjs/platform-express` | `^11.0.1` | HTTP-адаптер поверх Express (обработка запросов, middleware). Альтернатива — Fastify. |
| `reflect-metadata` | `^0.2.2` | Полифилл Reflect Metadata API. Нужен декораторам и DI Nest для чтения типов в рантайме. |
| `rxjs` | `^7.8.1` | Реактивные потоки (Observable). На них построены интерсепторы Nest и потоковые ответы. |

### Конфигурация и валидация

| Пакет | Версия | Назначение |
| --- | --- | --- |
| `@nestjs/config` | `^12.0.0` | Загрузка `.env`, типизированный `ConfigService` (ТЗ §6). В `app.module.ts`: `expandVariables: true`. |
| `class-validator` | `^0.15.1` | Декларативная валидация DTO (`@IsEmail()`, `@IsInt()` …) — ТЗ §7. |
| `class-transformer` | `^0.5.1` | Преобразование plain-объектов в классы DTO (работает в паре с `ValidationPipe`). |
| `dotenv` | `^17.4.2` | Явная загрузка `.env`. Нужна `is-dev-util.ts` (чтобы `IS_DEV_ENV` был известен до `ConfigModule`) и `prisma.config.ts` (Prisma 7 сам `.env` не грузит). |
| `dotenv-expand` | `^1000.0.0` | Раскрытие `${...}` в `.env` — `POSTGRES_URI` / `REDIS_URI` / `APPLICATION_URL` собираются из частей. Использует `prisma.config.ts`. |

### База данных

| Пакет | Версия | Назначение |
| --- | --- | --- |
| `@prisma/client` | `^7.10.0` | Клиент запросов к PostgreSQL. Prisma 7: generator `prisma-client` (не `-js`), клиент генерится в `backend/generated/prisma` (`moduleFormat = "cjs"`), в рантайме нужен driver-адаптер `@prisma/adapter-pg` + `pg` (ещё не установлены). Мажор совпадает с dev-пакетом `prisma`. |

### Аутентификация, сессии, cookies

| Пакет | Версия | Назначение |
| --- | --- | --- |
| `argon2` | `^0.45.1` | Хэширование паролей (ТЗ §7). Нативный модуль — при сборке под Alpine компилируется (см. `backend/Dockerfile`, стадия `deps`). |
| `express-session` | `^1.19.0` | Серверные сессии (session-cookie + хранилище). |
| `connect-redis` | `^10.0.0` | Стор для `express-session` поверх Redis — сессии не в памяти процесса. |
| `ioredis` | `^6.0.0` | Клиент Redis (используется и как стор сессий, и напрямую при необходимости). |
| `cookie-parser` | `^1.4.7` | Разбор и подпись cookie (`COOKIES_SECRET`). |

### Почта и антиспам

| Пакет | Версия | Назначение |
| --- | --- | --- |
| `@nestjs-modules/mailer` | `^2.3.7` | Обёртка Nest над nodemailer: DI-сервис отправки писем, шаблоны. |
| `nodemailer` | `^9.0.6` | Транспорт SMTP (peer-зависимость mailer'а). |
| `@nestlab/google-recaptcha` | `^3.11.3` | Guard/декоратор для проверки Google reCAPTCHA (`RECAPTCHA_SECRET_KEY`). |

---

## 3. Backend — разработка

`backend/package.json` → `devDependencies`. В продакшн-образ **не** попадают
(вырезаются `npm prune --omit=dev` на стадии `build`).

### Сборка и запуск

| Пакет | Версия | Назначение |
| --- | --- | --- |
| `@nestjs/cli` | `^11.0.0` | CLI `nest`: `nest build`, `nest start --watch` (dev-режим), `nest generate`. |
| `@nestjs/schematics` | `^11.0.0` | Шаблоны кода для `nest generate` (модуль, контроллер, сервис, resource). |
| `prisma` | `^7.10.0` | CLI Prisma: `prisma migrate`, `prisma generate`, `prisma studio`. Мажор совпадает с `@prisma/client`. |
| `typescript` | `^5.7.3` | Компилятор TypeScript. |
| `ts-loader` | `^9.5.2` | Загрузчик TS для webpack-сборки, которую использует `nest build`. |
| `ts-node` | `^10.9.2` | Запуск `.ts` без предварительной компиляции (debug-скрипты, `test:debug`). |
| `tsconfig-paths` | `^4.2.0` | Резолвинг алиасов путей из `tsconfig.json` в рантайме ts-node/Jest. |
| `source-map-support` | `^0.5.21` | Стектрейсы с привязкой к исходным `.ts`, а не к скомпилированному `.js`. |

### Тесты

| Пакет | Версия | Назначение |
| --- | --- | --- |
| `jest` | `^30.0.0` | Тест-раннер (юнит + e2e; конфиг e2e — `test/jest-e2e.json`). |
| `ts-jest` | `^29.2.5` | Трансформер: Jest исполняет `.ts`-тесты напрямую. |
| `@nestjs/testing` | `^11.0.1` | `Test.createTestingModule(...)` — поднятие модулей Nest в изоляции для тестов. |
| `supertest` | `^7.0.0` | HTTP-запросы к поднятому приложению и ассерты по ответу (e2e). |

### Линт и формат

| Пакет | Версия | Назначение |
| --- | --- | --- |
| `eslint` | `^9.18.0` | Линтер (flat config — `eslint.config.mjs`). |
| `typescript-eslint` | `^8.20.0` | Парсер + правила ESLint для TypeScript (метапакет). |
| `@eslint/js` | `^9.18.0` | Базовый набор рекомендованных правил ESLint. |
| `@eslint/eslintrc` | `^3.2.0` | Мост для использования конфигов старого формата (`.eslintrc`) внутри flat config. |
| `eslint-config-prettier` | `^10.0.1` | Отключает правила ESLint, конфликтующие с форматированием Prettier. |
| `eslint-plugin-prettier` | `^5.2.2` | Запускает Prettier как правило ESLint (расхождения формата = ошибки линта). |
| `globals` | `^17.0.0` | Списки глобальных имён сред (node и т.д.) для конфига ESLint. |
| `prettier` | `^3.4.2` | Форматтер кода. |
| `@trivago/prettier-plugin-sort-imports` | `^6.0.2` | Плагин Prettier: автосортировка `import`-ов по группам. |

### Типы (`@types/*`)

| Пакет | Версия | Назначение |
| --- | --- | --- |
| `@types/node` | `^24.0.0` | Типы стандартной библиотеки Node. |
| `@types/express` | `^5.0.0` | Типы Express (Request/Response) для платформенного адаптера. |
| `@types/express-session` | `^1.19.0` | Типы `express-session`. |
| `@types/cookie-parser` | `^1.4.10` | Типы `cookie-parser`. |
| `@types/nodemailer` | `^8.0.1` | Типы `nodemailer` (мажор отстаёт от рантайма — норма). |
| `@types/uuid` | `^10.0.0` | Типы `uuid` (сам пакет — по мере надобности; в Node 22 есть `crypto.randomUUID()`). |
| `@types/jest` | `^30.0.0` | Типы глобалей Jest (`describe`, `it`, `expect`). |
| `@types/supertest` | `^7.0.0` | Типы supertest. |

---

## 4. Frontend — рантайм

`frontend/package.json` → `dependencies`. Входят в собранный бандл.

| Пакет | Версия | Назначение |
| --- | --- | --- |
| `vue` | `^3.5.40` | Фреймворк Vue 3 (Composition API, Single-File Components). |
| `vue-router` | `^5.2.0` | Клиентский роутинг SPA. Используется `createWebHistory` → нужен SPA-fallback в Caddy. |
| `pinia` | `^4.0.2` | Управление состоянием (стор). Указан в стеке ТЗ (п. 6). |
| `vue-toastification` | `^2.0.0-rc.5` | Тост-уведомления (сборка под Vue 3). Обёрнут в `stores/notifications.ts`, стиль под дизайн платформы в `src/assets/toast.css`. |
| `tailwindcss` | `^4.3.3` | Utility-first CSS. v4: конфиг в CSS (`@import 'tailwindcss'` в `src/assets/main.css`), без `tailwind.config.js`. |

---

## 5. Frontend — разработка

`frontend/package.json` → `devDependencies`. В бандл не входят.

### Сборка и dev-сервер

| Пакет | Версия | Назначение |
| --- | --- | --- |
| `vite` | `^8.1.5` | Сборщик и dev-сервer с HMR. `vite build` → `dist/`. |
| `@vitejs/plugin-vue` | `^6.0.8` | Поддержка `.vue` SFC в Vite. |
| `@vitejs/plugin-vue-jsx` | `^5.1.6` | Поддержка JSX/TSX в компонентах Vue. |
| `vite-plugin-vue-devtools` | `^8.1.5` | Встраивание панели Vue DevTools в dev-сервер. |
| `@tailwindcss/vite` | `^4.3.3` | Плагин Vite для Tailwind v4 — сканирует шаблоны и генерирует CSS без PostCSS-конфига. Подключён в `vite.config.ts`. |
| `npm-run-all2` | `^9.0.2` | `run-p` / `run-s` — параллельный и последовательный запуск npm-скриптов (`build`, `lint`). |
| `jiti` | `^2.7.0` | Рантайм-загрузчик TS/ESM — нужен ESLint, чтобы читать flat config в `.ts` (`eslint.config.ts`). |

### Проверка типов

| Пакет | Версия | Назначение |
| --- | --- | --- |
| `typescript` | `~6.0.0` | Компилятор TypeScript. |
| `vue-tsc` | `^3.3.7` | Проверка типов в `.vue` (`npm run type-check`). В Docker-сборке пропускается (`build-only`). |
| `@vue/tsconfig` | `^0.9.1` | Базовый `tsconfig` для приложений Vue. |
| `@tsconfig/node24` | `^24.0.4` | Базовый `tsconfig` для Node-части проекта (конфиги Vite/Vitest). |
| `@types/node` | `^24.13.3` | Типы Node. |
| `@types/jsdom` | `^28.0.3` | Типы jsdom для юнит-тестов. |

### Тесты

| Пакет | Версия | Назначение |
| --- | --- | --- |
| `vitest` | `^4.1.10` | Юнит-тест-раннер на движке Vite (`npm run test:unit`). |
| `@vue/test-utils` | `^2.4.11` | Монтирование Vue-компонентов и работа с ними в тестах. |
| `jsdom` | `^29.1.1` | Реализация DOM в Node — среда для юнит-тестов компонентов. |
| `@playwright/test` | `^1.61.1` | E2E-тесты в реальных браузерах (`npm run test:e2e`, конфиг `playwright.config.ts`). |

### Линт и формат

| Пакет | Версия | Назначение |
| --- | --- | --- |
| `oxlint` | `~1.73.0` | Быстрый линтер на Rust — первый проход (`lint:oxlint`). |
| `eslint` | `^10.7.0` | Линтер — второй проход (`lint:eslint`). |
| `eslint-plugin-oxlint` | `~1.73.0` | Отключает в ESLint правила, уже покрытые oxlint (без дублей). |
| `eslint-plugin-vue` | `~10.9.2` | Правила ESLint для `.vue`. |
| `vue-eslint-parser` | `^10.4.1` | Парсер `.vue` для ESLint (разбор `<template>`). |
| `@vue/eslint-config-typescript` | `^14.9.0` | Готовый пресет ESLint для связки Vue + TypeScript. |
| `@vitest/eslint-plugin` | `^1.6.23` | Правила ESLint для тестов Vitest. |
| `eslint-plugin-playwright` | `^2.10.5` | Правила ESLint для тестов Playwright. |
| `eslint-config-prettier` | `^10.1.8` | Отключает правила ESLint, конфликтующие с Prettier. |
| `prettier` | `3.9.5` | Форматтер кода (версия зафиксирована точно). |

---

## 6. Ещё не установлено

Стек аутентификации выбран по курсу: **сессии (`express-session` + Redis) + `argon2` +
Prisma**, поэтому JWT/passport из ТЗ §3.1 не используются. По остатку ТЗ §5–6
потребуются:

### Backend

| Пакет(ы) | Зачем |
| --- | --- |
| `prisma init` → `prisma/schema.prisma`, миграции | Схема `User` / `ReportEntry` (ТЗ §4). Плюс `binaryTargets` для Alpine и шаг `prisma generate` в `backend/Dockerfile` — см. [`PLAN.md`](PLAN.md) фаза 1. |
| `exceljs` | Генерация `.xlsx` отчётов (ТЗ §3.2, §3.3). |
| `helmet` | Базовые security-заголовки (ТЗ §7). |
| `uuid` *(опц.)* | Только если понадобится генерация UUID в коде — в Node 22 есть `crypto.randomUUID()`, а PK генерит Prisma. `@types/uuid` уже стоит. |

### Frontend

| Пакет(ы) | Зачем |
| --- | --- |
| `axios` (или нативный `fetch` + обёртка) | HTTP-клиент; при session-cookie — `withCredentials: true` (ТЗ §6). |
| UI-библиотека: `primevue` / `element-plus` / `naive-ui` | Таблицы и формы отчётов (ТЗ §6, выбор не зафиксирован). |
| Библиотека дат: `date-fns` / `dayjs` | Недельные диапазоны пн–пт, часовой пояс (ТЗ §3.4, §7). |
