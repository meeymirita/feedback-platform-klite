# Чеклист реализации

Краткий статус — что в проекте уже сделано. Подробности: [`TZ.md`](TZ.md),
[`PLAN.md`](PLAN.md), [`DOCKER.md`](DOCKER.md), [`DEPENDENCIES.md`](DEPENDENCIES.md),
[`FRONTEND_STRUCTURE.md`](FRONTEND_STRUCTURE.md).

Легенда: `[x]` готово · `[~]` частично · `[ ]` не начато.

> **Активная разработка сейчас — только фронтенд** (ветки `frontend/*`).
> Бэкенд — заготовка с авторизационного курса, к ТЗ ещё не приведён (см. раздел ниже).
> Фронтенд-ветки по мере готовности вливаются в `main` (ветки не удаляются).

---

## Инфраструктура — `[x]`

- [x] `docker-compose` (prod + `docker-compose.dev.yml`): postgres:16, redis:7, backend (Nest :3000), frontend (Caddy)
- [x] Caddy — точка входа: авто-HTTPS, раздача SPA, `/api/*` → backend, fallback на `index.html`
- [x] `.env` разделён: корневой — для compose, `backend/.env` — для приложения; есть `.env.example`
- [x] `Dockerfile` backend/frontend, `.dockerignore`
- [x] Prisma подключена: `prisma.config.ts` (v7, URL из `POSTGRES_URI`), `prisma validate` проходит

---

## Бэкенд (NestJS + сессии в Redis + Prisma + argon2)

### Готово

- [x] Каркас: `ConfigModule` (global, `expandVariables`), глобальный `ValidationPipe`, `cookie-parser`
- [x] Сессии: `express-session` + `connect-redis` + `RedisStore`, CORS с `credentials` — в `main.ts`
- [x] `PrismaModule` + `PrismaService`
- [x] Prisma-схема курса: `User` / `Account` / `Token`; enum `UserRole (REGULAR|ADMIN)`, `AuthMethod`, `TokenType`
- [x] Регистрация: `POST /auth/register` — проверка email, argon2-хэш, создание `User`, сохранение сессии
- [x] `UserService`: `findById` / `findByEmail` / `create`
- [x] Утилиты `libs/common` (is-dev, ms, parseBoolean), декоратор совпадения паролей, DTO `login`/`register`

### Не сделано (по [`PLAN.md`](PLAN.md) фазы 1–4, 7–8)

- [ ] Схема под [`TZ.md` §4](TZ.md): нет модели `ReportEntry`; роль `REGULAR` вместо `EMPLOYEE`; нет `fullName` / `isActive`
- [ ] Миграции не создавались (`prisma/migrations/` пуст), БД кодом не поднята
- [ ] `auth.login()` / `auth.logout()` — пустые заглушки; нет `refresh`, `change-password`
- [ ] Нет `SessionGuard`, `@Roles` / `RolesGuard`, `@Public`
- [ ] Нет сида первого админа
- [ ] Нет эндпоинтов `report-entries` (CRUD), `reports/weekly`, экспортов `.xlsx`
- [ ] `UserController` пустой — нет CRUD пользователей, `list` / `setActive` / `setPassword`
- [ ] Нет глобального фильтра исключений и логгера ошибок

---

## Фронтенд ← активная работа

### Готово (ветки `frontend/routing`, `frontend/stores`, `frontend/entries-crud`)

- [x] Стек: Vue 3 + TS + Vite + Pinia + vue-router + Tailwind v4, алиас `@/`
- [x] Роутинг: `login` (`/`) вне каркаса; `DefaultLayout` (сайдбар + `<RouterView>`) — родитель для `entries` / `weekly` / `employees` / `summary`; catch-all 404
- [x] Lazy-загрузка вьюх, `scrollBehavior`, `document.title` из `meta.label`, `RouteMeta` расширен (`nav` / `label`)
- [x] `AppSidebar` строит меню из маршрутов с `meta.nav`, активный пункт — по `route.name`
- [x] Экраны (вёрстка + демо-данные): `HomeView` (форма входа), `EntriesView`, `WeeklyReportView`, `EmployeesView`, `SummaryView`, `NotFoundView` (дизайн 404)
- [x] Pinia-сторы с демо-данными: `reportEntries` (общий для «Мои записи» и «Недельный отчёт»), `employees`, `summary` — чтение через `storeToRefs`
- [x] Ассеты: `logo.png` (256×256), `404.webp`
- [x] CRUD-экшены в сторах: `reportEntries` — плоский `entries[]`, `days` как `computed`, `addEntry` / `updateEntry` / `deleteEntry` (ветка `frontend/entries-crud`)
- [x] `types/` — общие интерфейсы: `ReportEntry` / `ReportDay` (`types/report.ts`), `Employee` (`types/employee.ts`); утилиты `utils/time.ts`, `utils/date.ts`
- [x] `EntryModal`: `v-model` + валидация + сабмит → `addEntry` / `updateEntry`; «Изменить» / «Удалить» на строках `EntriesView`; `utils/date.ts` — `toISODate` / `fromISODate` (ветка `frontend/entry-modal`)
- [x] `EmployeeModal` + `PasswordModal`: `v-model` + валидация + сабмит → `addEmployee` / `updateEmployee` / `setPassword`; `id` в `Employee`, инициалы из ФИО; «Изменить» / «Пароль» на строках `EmployeesView` (ветка `frontend/employee-modal`). Блокировка сотрудников убрана
- [x] Переключение недели (стрелки ← →): `weekOffset` в сторе `reportEntries`, `days` → недельный срез (Пн–Пт), `weekLabel` / `weekTotal` / `weekCount` / `canGoNext`; общий стор → неделя синхронна на «Мои записи» и «Недельном отчёте»; демо-данные за 2 недели (ветка `frontend/week-nav`)
- [x] Drill-down из сводного отчёта: `employeeId` в `ReportEntry`, маршрут `/employees/:id/weekly`, клик по строке сводного → недельный отчёт сотрудника (`viewEmployeeId` в сторе, «← Сводный отчёт»); `summary` теперь computed из `reportEntries` + `employees` (ветка `frontend/summary-drilldown`)

### В работе / дальше (фронт, на демо-данных)

- [ ] Кнопка «Скачать в Excel» — клиентский `.xlsx`
- [ ] Тесты (vitest настроен, тестов нет)

### В самом конце

- [ ] Регистрация / авторизация: auth-стор, роут-гард (`meta.requiresAuth` / `meta.roles`), форма входа, «войти как …»
- [ ] API-слой (`api/` пустой), замена демо-данных на запросы к бэку

> Адаптив под телефон ([`TZ.md` §7](TZ.md)) — не делаем: приложение только под ПК.
