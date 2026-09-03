# Деплой на VPS

Прод-стек: `docker-compose.yml` (Postgres + Redis + backend + Caddy).
Caddy сам выпускает и продлевает Let's Encrypt-сертификат.

- Домен: **meeymirita.ru**
- Сервер: **45.10.166.23**

---

## 1. Разовая подготовка сервера

```bash
# Docker + compose-плагин (Ubuntu/Debian)
curl -fsSL https://get.docker.com | sh

# Фаервол: наружу только SSH и веб
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

**DNS** (у регистратора домена) — до первого запуска:

| Тип | Имя | Значение |
|-----|-----|----------|
| A   | `@` (meeymirita.ru) | `45.10.166.23` |
| A   | `www` (опц.)        | `45.10.166.23` |

Проверить: `dig +short meeymirita.ru` → `45.10.166.23`.

---

## 2. Код и секреты

```bash
git clone https://github.com/meeymirita/feedback-platform-klite.git
cd feedback-platform-klite
git checkout main

cp .env.example .env
```

Заполнить `.env` — три секрета сгенерировать, пароли задать свои:

```bash
openssl rand -hex 32   # → COOKIES_SECRET
openssl rand -hex 32   # → SESSION_SECRET
openssl rand -hex 24   # → POSTGRES_PASSWORD / REDIS_PASSWORD
```

Обязательно проверить в `.env`:
- `SITE_ADDRESS=meeymirita.ru`, `ALLOWED_ORIGIN=https://meeymirita.ru`
- `HTTP_PORT=80`, `HTTPS_PORT=443`
- `SESSION_SECURE=true`
- `SEED_MIRA_EMAIL` / `SEED_MIRA_PASSWORD` — логин и пароль владельца

Комментарии в `.env` — **только на отдельной строке**. Хвостовой
`SESSION_DOMAIN=   # текст` docker compose при пустом значении затягивает
комментарий внутрь переменной → backend падает на выдаче куки.

`.env` в git не коммитится — он только на сервере.

---

## 3. Первый запуск

```bash
# собрать образы
docker compose build

# поднять БД, дождаться готовности
docker compose up -d postgres redis

# создать схему в БД + завести пользователя MIRA (идемпотентно)
docker compose run --rm migrate

# поднять всё
docker compose up -d
```

Через ~30–60 с Caddy получит сертификат. Проверка:

```bash
curl -I https://meeymirita.ru          # 200, заголовок server: Caddy
curl -s -o /dev/null -w '%{http_code}\n' \
  https://meeymirita.ru/api/v1/users/profile   # 401 (не залогинен) — API живо
```

Открыть `https://meeymirita.ru`, войти под `SEED_MIRA_EMAIL` / `SEED_MIRA_PASSWORD`.

---

## 4. Обновление (новая версия)

```bash
cd feedback-platform-klite
git pull
docker compose build
docker compose run --rm migrate   # если менялась схема — накатит; иначе no-op
docker compose up -d
```

---

## 5. Эксплуатация

```bash
docker compose ps                       # статус
docker compose logs -f backend          # логи API
docker compose logs -f frontend         # логи Caddy (в т.ч. выдача серта)
docker compose restart backend

# бэкап БД
docker compose exec postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > backup_$(date +%F).sql

# восстановление
cat backup.sql | docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
```

Данные переживают перезапуск/пересборку — они в volume'ах
`meeymirita_pgdata`, `meeymirita_redisdata`, `meeymirita_caddy_data`.
`docker compose down` их не трогает; `docker compose down -v` — **удалит**.

---

## Если что-то не так

| Симптом | Причина |
|---|---|
| Caddy не выдаёт серт, в логах ACME-ошибка | DNS ещё не разошёлся, или 80/443 закрыты фаерволом |
| `502` на `/api/*` | backend не поднялся — `docker compose logs backend` (частая причина — не заполнен `.env`) |
| Логин не проходит, куки нет | `SESSION_SECURE=true`, но зашёл по `http://` — заходи по `https://` |
| `TypeError: option domain is invalid` в логах backend при логине | хвостовой `# комментарий` в строке `SESSION_DOMAIN=` — вынести комментарий на строку выше, `docker compose up -d --force-recreate backend` |
| `migrate` падает | не задан `SEED_MIRA_EMAIL` / `SEED_MIRA_PASSWORD`, либо Postgres не готов |
