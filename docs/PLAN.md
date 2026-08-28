# План действий: от скелета до готового MVP

Пошаговый порядок разработки по [`TZ.md`](TZ.md). Идём сверху вниз — каждый шаг
опирается на предыдущий. У каждого шага есть критерий **«Готово когда»**.

Инфраструктура (Docker, Postgres, **Redis**, Caddy, HTTPS, dev/prod-режимы)
**уже готова** — см. [`DOCKER.md`](DOCKER.md). Начинаем с кода.

> **Стек аутентификации (по курсу) отличается от ТЗ §3.1.** Вместо JWT/passport
> используются **серверные сессии**: `express-session` + `connect-redis` (стор в
> Redis) + `ioredis`, пароли — `argon2`, ORM — Prisma, плюс `@nestjs-modules/mailer`
> и `@nestlab/google-recaptcha`. Пакеты установлены и Redis добавлен в compose
> ([`DEPENDENCIES.md`](DEPENDENCIES.md)). В шагах фазы 2 ниже «JWT» → читать как
> «сессия»: `POST /auth/login` создаёт сессию, `SessionGuard` вместо `JwtAuthGuard`,
> `refresh`/`logout` — операции над сессией.

---

## С чего начать прямо сейчас (первые 3 шага)

1. **Шаг 0.1** — принять 3 решения (ORM, UI-библиотека, HTTP-клиент), ниже есть рекомендации.
2. **Шаг 1.1–1.3** — поднять конфиг, подключение к БД и первую миграцию. Это фундамент,
   без него не поедет ничего.
3. **Шаг 2** — аутентификация и роли. Пока её нет, остальные эндпоинты негде защищать.

Дальше — строго по номерам.

---

## Фаза 0. Решения и подготовка

### 0.1. Зафиксировать выбор из «или/или» в ТЗ

| Вопрос ТЗ | Варианты | Рекомендация | Почему |
| --- | --- | --- | --- |
| ORM (п. 6) | TypeORM / **Prisma** | **Prisma** | Типобезопасность из коробки, простые миграции (`prisma migrate`), меньше бойлерплейта. |
| UI-библиотека (п. 6) | **PrimeVue** / Element Plus / Naive UI | **PrimeVue** | Лучший `DataTable` (сортировка, группировка строк по дню — как в образце отчёта), готовые формы, экспорт. |
| HTTP-клиент (п. 6) | **Axios** / Fetch | **Axios** | Interceptor'ы для подстановки access-токена и авто-`refresh` по 401 пишутся чище. |

> Дальше план написан под **Prisma + PrimeVue + Axios**. При другом выборе меняются
> пакеты и пара шагов фазы 1/5, структура остаётся.

### 0.2. Почищен скелет

Демо-контент Vue удалён, `App.vue` / роутер / `HomeView` сведены к минимуму,
бэкенд-заглушка поправлена. Стартовая точка чистая. *(сделано)*

### 0.3. Переменные окружения — *(сделано по курсу)*

Фактическая раскладка (не как в черновике плана):

- **`backend/.env`** (dev на хосте) и **`backend/.env.example`** — переменные
  приложения: `APPLICATION_PORT` · `APPLICATION_URL` · `ALLOWED_ORIGIN` ·
  `COOKIES_SECRET` · `POSTGRES_*` + `POSTGRES_URI` · `REDIS_*` + `REDIS_URI`.
- **корневой `.env` / `.env.example`** — только для `docker compose`.
- Prisma CLI берёт `POSTGRES_URI` из `prisma.config.ts` (v7: в схеме `url` больше нет).
- Секретов JWT нет — аутентификация на сессиях (см. заметку вверху).

Разбор всех переменных — в [`DOCKER.md` §3](DOCKER.md#3-переменные-окружения-два-файла).

---

## Фаза 1. Фундамент бэкенда

### 1.1. Конфигурация — *(сделано по курсу)*

`@nestjs/config` подключён в `app.module.ts`: `isGlobal: true`,
`expandVariables: true` (в `.env` есть `${...}`), `ignoreEnvFile: !IS_DEV_ENV`
(в проде переменные из окружения, не из файла). `main.ts` читает через
`config.getOrThrow(...)`.

### 1.2. Подключение к БД (Prisma) — *частично*

Сделано: схема `prisma/schema.prisma` (модели `User` / `Account` / `Token`,
generator `prisma-client`, `moduleFormat = "cjs"`), `prisma.config.ts` (v7:
`dotenv-expand` + `datasource.url = POSTGRES_URI`), `prisma validate` проходит.

Осталось:
- `npm i @prisma/adapter-pg pg` — Prisma 7 требует driver-адаптер в рантайме.
- `PrismaModule` + `PrismaService`: `new PrismaClient({ adapter: new PrismaPg(pool) })`,
  `onModuleInit` → проверка соединения, `onModuleDestroy` → `pool.end()`.
- `output` клиента — `backend/generated/prisma` (вне `src/`) → при импорте из `src/`
  `nest build` с `rootDir: "src"` ругнётся. Варианты: перенести `output` в
  `../src/generated/prisma`, либо убрать `rootDir` из `tsconfig.build.json`
  (тогда следить, чтобы `dist/main.js` не уехал в `dist/src/`).
- `backend/Dockerfile` (стадия `build`): раскомментировать `RUN npx prisma generate`
  и `COPY --from=build /app/generated ./generated` в production.

**Готово когда:** `PrismaService` инжектится, тестовый запрос к БД проходит.

### 1.3. Схема данных и первая миграция

Из [`TZ.md` §4](TZ.md#4-модель-данных-черновая):

```prisma
model User {
  id           String   @id @default(uuid())
  fullName     String
  email        String   @unique
  passwordHash String
  role         Role     @default(EMPLOYEE)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  entries      ReportEntry[]
}

model ReportEntry {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  entryDate   DateTime @db.Date
  domain      String
  taskLink    String
  description String
  timeMinutes Int
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@index([userId, entryDate])
}

enum Role { EMPLOYEE ADMIN }
```

- `npx prisma migrate dev --name init`
- Прогон миграций при старте контейнера: в `backend`-сервисе `docker-compose.yml`
  запускать `npx prisma migrate deploy && node dist/main` (через entrypoint-скрипт
  или `command`).

**Готово когда:** таблицы `User` / `ReportEntry` есть в БД (`docker compose exec postgres psql -U root -d full-authorization -c '\dt'`).

### 1.4. Каркас приложения

- Глобальный `ValidationPipe` (`whitelist: true, transform: true`) — [`TZ.md` §7](TZ.md#7-нефункциональные-требования).
- Глобальный фильтр исключений + логгер ошибок (`Logger` Nest или `pino`).
- Префикс `app.setGlobalPrefix('api')`? **Нет** — Caddy уже срезает `/api` (см. `DOCKER.md`).
  Роуты объявляем без `/api`.
- CORS: не нужен (один origin через Caddy), но включить для dev-порта Vite при
  прямом обращении к `:3000`.
- `cookie-parser` для refresh-cookie.

**Готово когда:** невалидный body → `400` с описанием полей; ошибка в сервисе → залогирована, наружу `500` без стека.

---

## Фаза 2. Аутентификация и роли ([`TZ.md` §2, §3.1](TZ.md#2-роли-и-права-доступа))

### 2.1. Пакеты и утилиты

- `npm i @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt`
- `npm i -D @types/passport-jwt @types/bcrypt`
- `HashService`: `hash()` / `compare()` на bcrypt (`BCRYPT_ROUNDS`).

### 2.2. Users-модуль (базовый)

- `UsersService`: `findByEmail`, `findById`, `create`, `setPassword`, `setActive`, `list`.
- Пароль наружу не отдаём никогда (Prisma `select` без `passwordHash` или маппинг в DTO).

### 2.3. Логин + JWT

- `POST /auth/login` → проверка email+пароль+`isActive` → `{ accessToken }` в теле +
  `refreshToken` в httpOnly-cookie (`Secure`, `SameSite=Lax`, `path=/auth`).
- `JwtStrategy` (Passport) на access-токене → `req.user = { id, role }`.
- `JwtAuthGuard` глобально (`APP_GUARD`), публичные роуты помечаем `@Public()`.

### 2.4. Refresh + logout + смена пароля

- `POST /auth/refresh` — читает cookie, валидирует refresh, выдаёт новый access
  (+ ротация refresh). Отдельный секрет `JWT_REFRESH_SECRET`.
- `POST /auth/logout` — чистит cookie.
- `POST /auth/change-password` — для себя, требует текущий пароль ([`TZ.md` §3.1](TZ.md#31-аутентификация)).

### 2.5. Роли

- `@Roles('ADMIN')` + `RolesGuard` (читает `req.user.role`).
- Хелпер проверки «свои данные или админ»: сотрудник не может запрашивать чужой
  `userId` ([`TZ.md` §5](TZ.md#5-api-основные-эндпоинты-rest)).

### 2.6. Сид первого админа

- На старте: если таблица `User` пуста — создать админа из `SEED_ADMIN_*`.
- Самостоятельной регистрации нет ([`TZ.md` §2](TZ.md#2-роли-и-права-доступа)) — только этот путь и создание админом.

**Готово когда:** `login` отдаёт токен; защищённый роут без токена → `401`;
роут с `@Roles('ADMIN')` под сотрудником → `403`; `refresh` по cookie обновляет
access; `change-password` меняет пароль и старый перестаёт работать.

---

## Фаза 3. CRUD записей отчёта ([`TZ.md` §3.2, §3.4, §5](TZ.md#32-личный-кабинет-сотрудника))

### 3.1. DTO + валидация

- `CreateReportEntryDto`: `entryDate` (ISO date), `domain` (string, непустая),
  `taskLink` (URL), `description` (string), `timeMinutes` (int > 0).
- `time_minutes` — единица хранения; UI-формат `чч:мм` парсится на фронте.
- Мягкая проверка «> 8 ч» — **не** на бэке (не блокирует), подсказка в UI ([решение №6](TZ.md#8-зафиксированные-решения)).

### 3.2. Эндпоинты (свои данные)

- `GET /report-entries?from=&to=` — только записи `req.user.id`.
- `POST /report-entries` — создать на `req.user.id`.
- `PATCH /report-entries/:id` — только своя запись; **любой прошедший день, без
  ограничения по сроку** ([решение №1](TZ.md#8-зафиксированные-решения)).
- `DELETE /report-entries/:id` — только своя запись.

### 3.3. Тот же набор для админа

- `GET /report-entries?userId=&from=&to=` — под `@Roles('ADMIN')`.

**Готово когда:** сотрудник A не видит и не может изменить запись сотрудника B
(`403/404`); CRUD своих записей работает; правки задним числом проходят.

---

## Фаза 4. Недельный отчёт и экспорт своего ([`TZ.md` §3.2](TZ.md#32-личный-кабинет-сотрудника))

### 4.1. Агрегация недели

- `GET /reports/weekly?week=YYYY-MM-DD` — `week` = любая дата недели, сервер
  приводит к **понедельнику**; выборка пн–пт ([решение №3](TZ.md#8-зафиксированные-решения)),
  сб/вс не включаются.
- Ответ: сгруппировано по `entryDate`, внутри дня — все записи построчно (без
  слияния одинаковых доменов), плюс `totalMinutesPerDay` и `totalMinutesWeek`.
- Даты хранятся в UTC, отдаются как есть; отображение в `APP_TZ` — на фронте ([`TZ.md` §7](TZ.md#7-нефункциональные-требования)).
- Вынести работу с неделями в `week.util.ts` (start/end, список рабочих дней).

### 4.2. Excel-экспорт своего отчёта

- `npm i exceljs`
- `GET /reports/weekly/export?week=...` → `.xlsx` в структуре образца
  (колонки: День · Домен · Ссылка · Время; итоги снизу).
- `ReportExcelService` — построение книги; переиспользуется в фазе 8.
- Заголовки ответа: `Content-Type` xlsx + `Content-Disposition: attachment`.

**Готово когда:** `GET /reports/weekly` возвращает корректную группировку и суммы
для тестовых данных; скачанный файл открывается в Excel и совпадает по форме с образцом.

---

## Фаза 5. Фундамент фронтенда

### 5.1. Пакеты и структура

- `npm i axios primevue @primevue/themes primeicons` (+ дата-утилиты: `npm i date-fns`).
- Папки: `src/{api,stores,router,layouts,pages,components,composables,types}`.
- Подключить PrimeVue (тема, `primeicons`) в `main.ts`.

### 5.2. API-слой

- `src/api/http.ts` — инстанс Axios (`baseURL: '/api'`), request-interceptor
  добавляет `Authorization: Bearer`, response-interceptor на `401` дергает
  `/auth/refresh` и повторяет запрос (очередь на время refresh).
- `src/api/{auth,reportEntries,reports,users}.ts` — типизированные функции на каждый эндпоинт.

### 5.3. Auth-стор (Pinia) + guard роутера

- `useAuthStore`: `accessToken` (в памяти), `user`, `login()`, `logout()`,
  `fetchMe()`, `changePassword()`.
- `router.beforeEach` — редирект на `/login` без токена; проверка `role` для
  админских маршрутов; после `login` — на `/`.

### 5.4. Каркас UI

- `DefaultLayout` (шапка: имя, роль, выход) + `AuthLayout` (для `/login`).
- Страница `LoginPage` — email + пароль, ошибки, редирект.
- Пустой `DashboardPage` за авторизацией.

**Готово когда:** без токена любой роут кидает на `/login`; успешный вход открывает
дашборд; протухший access молча обновляется через refresh; `выход` чистит сессию.

---

## Фаза 6. Личный кабинет сотрудника (UI) ([`TZ.md` §3.2](TZ.md#32-личный-кабинет-сотрудника))

### 6.1. Форма записи

- Поля: дата (дефолт — сегодня), домен, ссылка, «что сделал» (textarea), время.
- Ввод времени: `чч:мм` **или** минуты через степпер → нормализация в минуты.
- Мягкое предупреждение при > 8 ч (не блокирует сохранение) ([решение №6](TZ.md#8-зафиксированные-решения)).
- Клиентская валидация зеркалит DTO бэка ([`TZ.md` §7](TZ.md#7-нефункциональные-требования)).

### 6.2. Список своих записей

- Группировка по дням; действия «редактировать» / «удалить» на каждой строке
  (без ограничения по сроку — [решение №1](TZ.md#8-зафиксированные-решения)).
- Несколько записей в день — норма.

### 6.3. Просмотр недельного отчёта

- `DataTable` в форме образца: строки сгруппированы по дню недели (пн–пт),
  внутри дня — все задачи построчно, домены не сливаются.
- Итог по дню и по неделе.
- Переключатель недель: стрелки ‹ ›  + выбор даты диапазона.
- Время из минут → `ч:мм` для показа; даты — в `APP_TZ`.

### 6.4. Кнопка «Скачать в Excel»

- Дёргает `/reports/weekly/export?week=...`, отдаёт файл как blob-download.

**Готово когда:** сотрудник заводит несколько задач за день, видит их в списке и
в недельной таблице с верными суммами, переключает недели, качает совпадающий с
образцом `.xlsx`.

---

## Фаза 7. Админ-панель ([`TZ.md` §3.3](TZ.md#33-панель-администратора))

### 7.1. Бэкенд — пользователи

- `GET /users` — список: имя, email, роль, статус, **дата последней записи**
  (подзапрос `max(entryDate)`).
- `POST /users` — создать (имя, email, врем. пароль, роль).
- `PATCH /users/:id` — редактировать, блокировать/разблокировать, менять роль,
  сбросить пароль (генерация нового врем. пароля, без email — [`TZ.md` §3.1](TZ.md#31-аутентификация)).
- Всё под `@Roles('ADMIN')`.

### 7.2. Бэкенд — чужие отчёты и сводка

- `GET /reports/weekly?userId=&week=` — та же агрегация, что в фазе 4, для любого сотрудника.
- `GET /reports/summary?week=` — по всем сотрудникам: строка на человека с суммой
  минут за неделю (для drill-down на фронте).

### 7.3. Фронтенд — админ

- Страница «Сотрудники»: таблица + модалки создания/редактирования/блокировки.
- Страница «Отчёты»: выбор сотрудника + недели → та же таблица недельного отчёта.
- Страница «Сводка»: список сотрудников с суммарным временем, клик → отчёт человека.
- Маршруты только для `role === 'ADMIN'` (guard из 5.3).

**Готово когда:** админ создаёт/блокирует сотрудника, видит недельный отчёт любого,
открывает сводку и проваливается в конкретного сотрудника; сотрудник этих
страниц/эндпоинтов не получает (`403`).

---

## Фаза 8. Экспорты админа ([`TZ.md` §3.3, решение №4](TZ.md#8-зафиксированные-решения))

- `GET /reports/weekly/export?userId=&week=` — `.xlsx` по одному сотруднику
  (та же форма, что видит сам сотрудник) — переиспользует `ReportExcelService`.
- `GET /reports/export/all?week=` — «пакет отдельных отчётов»: **один `.xlsx`, лист
  на каждого сотрудника** (не сводный лист с перемешанными данными). Опционально —
  вариант «zip из отдельных файлов».
- Кнопки экспорта на страницах «Отчёты» и «Сводка».

**Готово когда:** оба экспорта скачиваются; в файле «по всем» — по листу на
сотрудника с его формой отчёта.

---

## Фаза 9. Нефункциональные требования ([`TZ.md` §7](TZ.md#7-нефункциональные-требования))

- Валидация форм на фронте **и** бэке — пройтись по всем формам, свести правила.
- Время: хранение в UTC, показ в `APP_TZ` — проверить на границах недели/суток.
- Пароли — только bcrypt-хэш, нигде не логируются и не отдаются.
- Логи ошибок бэкенда — единый формат, уровень, без утечки секретов.
- Адаптив: форма записи должна работать с телефона (desktop — приоритет).
- `helmet` на бэке; проверить заголовки, которые не ставит Caddy.
- README-заметка: бэкап БД — эксплуатационная задача, вне MVP.

**Готово когда:** чек-лист §7 пройден пунктом за пунктом.

---

## Фаза 10. Тесты, CI, документация

- **Бэкенд:** unit на `week.util`, `HashService`, guard'ы; e2e (supertest) на
  `auth` + `report-entries` (изоляция прав) + `reports/weekly`.
- **Фронтенд:** unit (vitest) на парсер времени и утилиты недели; e2e (Playwright)
  на сценарий «вход → добавить запись → увидеть в недельном отчёте».
- **CI:** GitHub Actions — `lint` + `type-check` + `test` + `docker compose build`
  для обоих пакетов.
- Обновить [`DEPENDENCIES.md`](DEPENDENCIES.md) (раздел «запланировано» → факт) и
  [`DOCKER.md`](DOCKER.md) (шаг миграций в entrypoint backend).

**Готово когда:** `npm test` зелёный в обоих пакетах, CI проходит на PR.

---

## После MVP ([`TZ.md` §9](TZ.md#9-этапы-разработки-предложение))

- **Этап 2** уже частично закрыт фазами 7–8 (сводка, экспорт по всем, управление
  пользователями из UI) — довести оставшееся.
- **Этап 3 (опц.):** интеграция с Bitrix24 API — автоподстановка названия задачи
  по ссылке; прочие доработки по запросу заказчика.

---

## Порядок одной строкой

`0.1 выбор → 1.1 config → 1.2 Prisma → 1.3 миграция → 1.4 каркас →
2 auth+роли+сид → 3 CRUD записей → 4 недельный отчёт + свой Excel →
5 фронт-фундамент → 6 кабинет сотрудника → 7 админ (API+UI) → 8 экспорты админа →
9 NFR → 10 тесты+CI`
