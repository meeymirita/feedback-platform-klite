import { createRouter, createWebHistory } from 'vue-router'

// TODO (доделать роутинг перед мержем ветки):
//  - scrollBehavior: () => ({ top: 0 }) в createRouter
//  - meta.title у страниц + router.afterEach(to => document.title = ...)
//
// TODO (другие ветки, не сейчас):
//  - auth: beforeEach-гард, meta.requiresAuth + meta.roles: ['admin'] на /employees и /summary,
//    редирект гостей на /login, залогиненных с '/' в /entries
//  - drill-down: /employees/:id/weekly (просмотр чужого отчёта из сводного, ТЗ 3.3)
//  - инфра: fallback на index.html в Caddy для createWebHistory (иначе прямой заход по /entries → 404)

// Пункты бокового меню берутся из самих маршрутов:
// meta.nav === true → маршрут показывается в сайдбаре, meta.label — его подпись.
// Порядок пунктов = порядок маршрутов ниже.
declare module 'vue-router' {
  interface RouteMeta {
    nav?: boolean
    label?: string
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    {
      path: '/', // Страница входа
      name: 'login',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/',
      component: () => import('@/components/layout/DefaultLayout.vue'),
      children: [
        {
          path: 'entries',
          name: 'entries',
          component: () => import('@/views/EntriesView.vue'),
          meta: { nav: true, label: 'Мои записи'},
        },
        {
          path: 'weekly',
          name: 'weekly',
          component: () => import('@/views/WeeklyReportView.vue'),
          meta: { nav: true, label: 'Недельный отчёт'},
        },
        {
          path: 'employees',
          name: 'employees',
          component: () => import('@/views/EmployeesView.vue'),
          meta: { nav: true, label: 'Сотрудники'},
        },
        {
          path: 'summary',
          name: 'summary',
          component: () => import('@/views/SummaryView.vue'),
          meta: { nav: true, label: 'Сводный отчёт'},
        },
      ],
    },
    {
      // 404 — на весь экран, без каркаса кабинета. Ловит всё, что не совпало выше.
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { nav: false, label: 'Неизвестная страница'},
    },
  ],
})
router.afterEach((to) => {
  document.title = to.meta.label ? `${to.meta.label}` : 'k - report'
})
export default router

/* ─────────────────────────────────────────────────────────────────────────────
   ЗАДАЧА ВЕТКИ frontend/entries-crud  (эта заметка временная, удалить по готовности)

   Цель: reportEntries переходит на плоский список записей + экшены CRUD,
   плюс общие типы и утилиты. Фундамент под модалки (следующая ветка).

   ── 1. src/types/report.ts ──────────────────────────────────────────────────
   export interface ReportEntry {
     id: string
     date: string     // 'ДД.ММ.ГГГГ' — пока строка, как в демо
     domain: string
     link: string      // 'bitrix24 · #123123123' — метка, пока не URL
     desc: string
     time: string      // 'ч:мм'
   }
   export interface ReportDay {
     name: string       // 'Понедельник'…'Пятница' — из даты
     date: string
     total: string      // сумма time за день, 'ч:мм'
     rows: ReportEntry[]
   }

   ── 2. src/types/employee.ts ────────────────────────────────────────────────
   export interface Employee {
     initials: string
     name: string
     email: string
     role: 'Сотрудник' | 'Админ'
     last: string       // дата последней записи или '—'
     active: boolean    // false — заблокирован
   }
   → в stores/employees.ts: const employees = ref<Employee[]>([...])

   ── 3. src/utils/time.ts ────────────────────────────────────────────────────
   export function toMinutes(hhmm: string): number {
     const [h, m] = hhmm.split(':').map(Number)
     return h * 60 + m
   }
   export function fromMinutes(total: number): string {
     return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
   }

   ── 4. src/utils/date.ts ────────────────────────────────────────────────────
   // '31.08.2026' → 'Понедельник'
   export function weekdayName(dmy: string): string {
     const [d, m, y] = dmy.split('.').map(Number)
     const n = new Date(y, m - 1, d).toLocaleDateString('ru-RU', { weekday: 'long' })
     return n.charAt(0).toUpperCase() + n.slice(1)
   }

   ── 5. src/stores/reportEntries.ts ──────────────────────────────────────────
   import { ref, computed } from 'vue'
   import { defineStore } from 'pinia'
   import type { ReportEntry, ReportDay } from '@/types/report'
   import { toMinutes, fromMinutes } from '@/utils/time'
   import { weekdayName } from '@/utils/date'

   export const useReportEntriesStore = defineStore('reportEntries', () => {
     const entries = ref<ReportEntry[]>([ ...ДЕМО НИЖЕ... ])

     const days = computed<ReportDay[]>(() => {
       const byDate = new Map<string, ReportEntry[]>()
       for (const e of entries.value) {
         if (!byDate.has(e.date)) byDate.set(e.date, [])
         byDate.get(e.date)!.push(e)
       }
       return [...byDate.entries()].map(([date, rows]) => ({
         name: weekdayName(date),
         date,
         total: fromMinutes(rows.reduce((s, r) => s + toMinutes(r.time), 0)),
         rows,
       }))
     })

     function addEntry(data: Omit<ReportEntry, 'id'>) {
       entries.value.push({ id: crypto.randomUUID(), ...data })
     }
     function updateEntry(id: string, patch: Partial<Omit<ReportEntry, 'id'>>) {
       const e = entries.value.find((x) => x.id === id)
       if (e) Object.assign(e, patch)
     }
     function deleteEntry(id: string) {
       entries.value = entries.value.filter((x) => x.id !== id)
     }

     return { entries, days, addEntry, updateEntry, deleteEntry }
   })

   ── ДЕМО-ДАННЫЕ (плоско, из прежнего days) ──────────────────────────────────
   [
     { id: '1',  date: '31.08.2026', domain: 'ggs-service.ru',  link: 'bitrix24 · #123123123', desc: 'Правки на главной: заменил баннер, пересобрал блок услуг', time: '1:55' },
     { id: '2',  date: '31.08.2026', domain: 'stena-nso.ru',    link: 'bitrix24 · #123145900', desc: 'Собрал каталог из выгрузки, настроил фильтры по типу панелей', time: '3:30' },
     { id: '3',  date: '01.09.2026', domain: 'condor-nsk.ru',   link: 'bitrix24 · #123150411', desc: 'Перенёс сайт на новый хостинг, проверил редиректы и SSL', time: '3:50' },
     { id: '4',  date: '01.09.2026', domain: 'dkedra.ru',       link: 'bitrix24 · #123151002', desc: 'Правки в форме заявки, подключил уведомления на почту', time: '1:30' },
     { id: '5',  date: '02.09.2026', domain: 'biomaster.pro',   link: 'bitrix24 · #123160877', desc: 'Вёрстка страницы «Оборудование» по макету', time: '3:00' },
     { id: '6',  date: '02.09.2026', domain: 'ggs-service.ru',  link: 'bitrix24 · #123161340', desc: 'Скорость загрузки: сжал изображения, отложил сторонние скрипты', time: '2:25' },
     { id: '7',  date: '03.09.2026', domain: 'stena-nso.ru',    link: 'bitrix24 · #123170255', desc: 'Интеграция с 1С: сопоставил номенклатуру, настроил расписание обмена', time: '4:25' },
     { id: '8',  date: '03.09.2026', domain: 'dkedra.ru',       link: 'bitrix24 · #123170980', desc: 'Мелкие правки по замечаниям заказчика', time: '1:15' },
     { id: '9',  date: '04.09.2026', domain: 'condor-nsk.ru',   link: 'bitrix24 · #123180114', desc: 'Настроил цели в Метрике, собрал отчёт по заявкам за август', time: '3:15' },
     { id: '10', date: '04.09.2026', domain: 'biomaster.pro',   link: 'bitrix24 · #123180677', desc: 'Обновил каталог: 24 новых товара, перепроверил цены', time: '2:30' },
   ]

   ── НЕ ТРОГАТЬ в этой ветке ─────────────────────────────────────────────────
   • Шаблоны вьюх — days наружу отдаётся тот же, EntriesView/WeeklyReportView не меняются.
   • Кнопки «Изменить»/«Удалить», модалки (v-model, валидация, сабмит) — следующая ветка.
   • ISO-даты и минуты числом — вместе с API-слоем.

   ── ПРОВЕРКА ───────────────────────────────────────────────────────────────
   npm run type-check && npm run lint && npm run build
   npm run dev — данные на «Мои записи» и «Недельном отчёте» на месте, суммы дней совпадают.

   ── ПОСЛЕ ГОТОВНОСТИ ───────────────────────────────────────────────────────
   • Отметить пункты в docs/CHECKLIST.md (раздел «Фронтенд → В работе / дальше»).
   • Удалить эту заметку.
───────────────────────────────────────────────────────────────────────────── */
