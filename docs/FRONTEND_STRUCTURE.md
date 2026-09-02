# Структура фронтенда

Как разложены папки в `frontend/src/` и что куда класть. Ориентир — фичи из
[`PLAN.md`](PLAN.md): логин, кабинет сотрудника, недельный отчёт с таблицей.

- **Стек:** Vue 3 (`<script setup lang="ts">`) + vue-router + Pinia + Vite + Tailwind CSS v4.
- **Алиас:** `@/` → `frontend/src/` (настроен в `frontend/vite.config.ts`).
  Импортируй всегда через `@/...`, а не `../../`.
- **Стили:** Tailwind подключён через `@tailwindcss/vite` (`@import 'tailwindcss'`
  в `src/assets/main.css`). Пиши классы прямо в `<template>`; кастомные токены и
  `@theme` — там же, в `main.css`. Отдельного `tailwind.config.js` в v4 нет.
- Пустые папки помечены `.gitkeep` — удаляй его, когда кладёшь первый реальный файл.

---

## Дерево

```
frontend/src/
├── api/            — запросы к бэкенду (пока пусто, ждёт API-слоя)
├── assets/         — css, картинки, шрифты
├── components/
│   ├── ui/         — переиспользуемые кирпичики без бизнес-логики
│   ├── layout/     — сайдбар, каркас кабинета (DefaultLayout)
│   ├── report/     — компоненты фичи «отчёт»
│   └── employee/   — компоненты фичи «сотрудники»
├── router/         — маршруты (index.ts)
├── stores/         — Pinia-сторы, глобальное состояние
├── types/          — общие TS-типы и интерфейсы
├── utils/          — чистые функции-хелперы
├── views/          — страницы, каждая привязана к маршруту
├── App.vue
└── main.ts
```

Каркас кабинета (сайдбар + `<RouterView>`) — это `components/layout/DefaultLayout.vue`,
отдельной папки `layouts/` не заводим. Переиспользуемую логику держим в Pinia-сторах,
папки `composables/` тоже нет. Новую папку под фичу (`components/auth/` и т.п.) заводи
по мере надобности — пустые каталоги заранее не плоди.

---

## Что куда класть

| Что делаешь | Куда | Пример |
| --- | --- | --- |
| Тип / интерфейс TS (структура данных, форма ответа API) | `types/` | `types/report.ts` → `export interface ReportEntry {...}` |
| Форма (ввод данных, `v-model`, `emit` наружу) | `components/<фича>/` | `components/report/ReportEntryForm.vue` |
| Таблица, список, карточка конкретной фичи | `components/<фича>/` | `components/report/ReportTable.vue` |
| Кнопка, инпут, модалка, спиннер — без логики, на весь проект | `components/ui/` | `components/ui/BaseButton.vue` |
| Шапка, меню, боковая панель | `components/layout/` | `components/layout/AppHeader.vue` |
| Целый экран, на который ведёт маршрут в `router/index.ts` | `views/` | `views/LoginView.vue`, `views/ReportView.vue` |
| Запрос к API (get/post) | `api/` | `api/report.ts` → `getEntries()`; `api/client.ts` — инстанс axios с интерсепторами |
| Глобальное состояние + переиспользуемая логика (текущий юзер, список записей, уведомления) | `stores/` | `stores/reportEntries.ts`, `stores/notifications.ts` |
| Форматирование даты, минуты→часы, склонения — чистая функция без Vue | `utils/` | `utils/date.ts`, `utils/time.ts`, `utils/plural.ts` |
| Общий каркас страниц (сайдбар + `<RouterView>`) | `components/layout/` | `components/layout/DefaultLayout.vue` |

---

## Как выбрать между похожими папками

- **`views/` или `components/`** — если на это ведёт запись в `router/index.ts`,
  то `views/`. Если рендерится внутри view — `components/`.
- **`components/ui/` или `components/<фича>/`** — если компонент можно вырвать и
  вставить в любой другой проект (кнопка, инпут), это `ui/`. Если он знает про
  «отчёт», «сотрудника», поля из ТЗ — папка фичи.
- **`stores/` или `utils/`** — общее состояние или логика с состоянием (нужно
  нескольким страницам, реактивно) → `stores/`. Чистая функция без Vue и без
  состояния → `utils/`.
- **`types/` или `utils/`** — `type` / `interface` → `types/`. Функция, которая
  что-то делает → `utils/`.

---

## Именование

- Файлы компонентов — **PascalCase, минимум два слова**: `ReportTable.vue`,
  `BaseButton.vue`. `eslint-plugin-vue` ругается на однословные имена.
- Префикс `Base` / `App` / `The` для инфраструктурных: `BaseInput`, `TheHeader`.
- В `<template>` тоже PascalCase: `<ReportTable :entries="entries" />`.
- Файлы в `types/`, `utils/`, `api/`, `stores/` — camelCase:
  `report.ts`, `date.ts`, `reportEntries.ts`.

---

## Пример: компонент и его подключение в view

`src/types/report.ts`:

```ts
export interface ReportEntry {
  id: string
  employeeId: string
  date: string // 'ДД.ММ.ГГГГ'
  domain: string
  link: string
  desc: string
  time: string // 'ч:мм'
}
```

`src/components/report/ReportTable.vue`:

```vue
<script setup lang="ts">
import type { ReportEntry } from '@/types/report'

defineProps<{ entries: ReportEntry[] }>()
</script>

<template>
  <table class="report-table">
    <tr v-for="e in entries" :key="e.id">
      <td>{{ e.domain }}</td>
      <td>{{ e.desc }}</td>
      <td>{{ e.time }}</td>
    </tr>
  </table>
</template>

<style scoped>
.report-table { width: 100%; }
</style>
```

`src/views/HomeView.vue`:

```vue
<script setup lang="ts">
import ReportTable from '@/components/report/ReportTable.vue'
import type { ReportEntry } from '@/types/report'

const entries: ReportEntry[] = []
</script>

<template>
  <main class="home">
    <ReportTable :entries="entries" />
  </main>
</template>
```
