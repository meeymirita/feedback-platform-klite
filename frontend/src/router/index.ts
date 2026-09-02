import { createRouter, createWebHistory } from 'vue-router'

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

/* ═════════════════════════════════════════════════════════════════════════════
   ЗАДАЧА ВЕТКИ frontend/week-nav   (заметка временная, удалить по готовности)

   Переключение недели стрелками ← → на «Мои записи» и «Недельном отчёте».
   Состояние недели — в сторе reportEntries (общий для обоих экранов, значит
   выбранная неделя синхронна). `days` становится недельным срезом; «Итого за
   неделю» и счётчик записей — computed из стора, хардкод 27:35 / «10 записей»
   убираем. Демо-данные — добавить предыдущую неделю, чтобы ← было что показать.

   ─────────────────────────────────────────────────────────────────────────────
   1. src/utils/date.ts — дописать (weekdayName не трогаем)

   export function parseDmy(dmy: string): Date {
     const [d, m, y] = dmy.split('.').map(Number)
     return new Date(y, m - 1, d)
   }
   export function addDays(d: Date, n: number): Date {
     const r = new Date(d)
     r.setDate(r.getDate() + n)
     return r
   }
   // понедельник (00:00) недели, содержащей d
   export function mondayOf(d: Date): Date {
     const r = new Date(d.getFullYear(), d.getMonth(), d.getDate())
     const day = r.getDay()               // 0=Вс..6=Сб
     return addDays(r, day === 0 ? -6 : 1 - day)
   }
   const dd = (n: number) => String(n).padStart(2, '0')
   export function weekRangeLabel(monday: Date): string {
     const fri = addDays(monday, 4)
     return `${dd(monday.getDate())}.${dd(monday.getMonth() + 1)} — ` +
       `${dd(fri.getDate())}.${dd(fri.getMonth() + 1)}.${fri.getFullYear()}`
   }

   ─────────────────────────────────────────────────────────────────────────────
   2. src/stores/reportEntries.ts

   import { weekdayName, parseDmy, addDays, mondayOf, weekRangeLabel } from '@/utils/date'

   • Демо-данные: добавить предыдущую неделю (Пн 24.08 — Пт 28.08.2026), ~5 строк
     (id 'p1'…'p5', те же домены), порядок в массиве не важен — фильтр + сортировка.

   • Состояние и геттеры недели (внутри defineStore, entries уже есть):

     const weekOffset = ref(0)            // 0 — неделя с «сегодня», −1 предыдущая, …
     const weekStart = computed(() => addDays(mondayOf(new Date()), weekOffset.value * 7))
     const isCurrentWeek = computed(() => weekOffset.value === 0)
     const canGoNext = computed(() => weekOffset.value < 0)   // вперёд текущей не пускаем
     function prevWeek() { weekOffset.value-- }
     function nextWeek() { if (canGoNext.value) weekOffset.value++ }
     const weekLabel = computed(() => weekRangeLabel(weekStart.value))

     const weekEntries = computed(() => {
       const start = weekStart.value
       const end = addDays(start, 5)      // [start, start+5) = Пн..Пт
       return entries.value.filter((e) => {
         const t = parseDmy(e.date)
         return t >= start && t < end
       })
     })

   • `days` — считать по weekEntries (не по entries) + отсортировать по дате:

     const days = computed<ReportDay[]>(() => {
       const byDate = new Map<string, ReportEntry[]>()
       for (const e of weekEntries.value) {
         if (!byDate.has(e.date)) byDate.set(e.date, [])
         byDate.get(e.date)!.push(e)
       }
       return [...byDate.entries()]
         .sort((a, b) => +parseDmy(a[0]) - +parseDmy(b[0]))
         .map(([date, rows]) => ({
           name: weekdayName(date),
           date,
           total: fromMinutes(rows.reduce((s, r) => s + toMinutes(r.time), 0)),
           rows,
         }))
     })

     const weekTotal = computed(() =>
       fromMinutes(weekEntries.value.reduce((s, e) => s + toMinutes(e.time), 0)),
     )
     const weekCount = computed(() => weekEntries.value.length)

   • return: добавить
       weekLabel, weekTotal, weekCount, isCurrentWeek, canGoNext, prevWeek, nextWeek

   ─────────────────────────────────────────────────────────────────────────────
   3. src/views/EntriesView.vue

   • storeToRefs(store): добавить weekLabel, weekTotal, isCurrentWeek, canGoNext
   • из store: добавить prevWeek, nextWeek
   • блок «Неделя»:
       «←»  -> @click="prevWeek"
       текст «31.08 — 04.09.2026»  -> {{ weekLabel }}
       «→»  -> @click="nextWeek" :disabled="!canGoNext"
              + в class: disabled:cursor-not-allowed disabled:opacity-40
       «текущая неделя»  -> обернуть в <span v-if="isCurrentWeek" ...>
       «Итого за неделю» 27:35  -> {{ weekTotal }}

   ─────────────────────────────────────────────────────────────────────────────
   4. src/views/WeeklyReportView.vue

   • <script setup>:
       const store = useReportEntriesStore()
       const { days, weekLabel, weekTotal, weekCount, canGoNext } = storeToRefs(store)
       const { prevWeek, nextWeek } = store
   • блок «Неделя»: «←» @click="prevWeek"; текст -> {{ weekLabel }};
       «→» @click="nextWeek" :disabled="!canGoNext" (+ те же disabled-классы)
   • футер таблицы:
       «Итого за неделю · 10 записей»  -> «Итого за неделю · {{ weekCount }} записей»
       27:35  -> {{ weekTotal }}
   • мелочь: :key="day.name" -> :key="day.date";  :key="i" -> :key="row.id"
     (i всё ещё нужен для «День только в первой строке» — оставить в v-for как
      второй параметр: v-for="(row, i) in day.rows")
   • «записей» без склонения — ок для демо.

   ─────────────────────────────────────────────────────────────────────────────
   НЕ ТРОГАЕМ в этой ветке
     • «Скачать в Excel» — отдельная ветка.
     • Пустые дни недели не рисуем (как и сейчас — только дни с записями);
       неделя без записей = пустой список, это норм.
     • Жёсткий «Соколов Артём Игоревич» в шапке недельного отчёта — с auth.
     • Синхронизация выбранной недели в URL — не нужно.

   ПРОВЕРКА
     npm run type-check && npm run lint && npm run build
     npm run dev:
       — «Мои записи» и «Недельный отчёт»: «←» уводит на 24.08 — 28.08.2026 с
         её записями; «→» возвращает, дальше текущей недели не пускает (кнопка
         неактивна и приглушена);
       — «Итого за неделю» и счётчик записей меняются по неделе, суммы дней сходятся;
       — неделя, выбранная на одном экране, та же на другом (общий стор);
       — запись, добавленная с датой другой недели, видна после перехода туда.

   ПОСЛЕ ГОТОВНОСТИ
     • docs/CHECKLIST.md: отметить «Переключение недели».
     • Удалить эту заметку из router/index.ts.
═════════════════════════════════════════════════════════════════════════════ */
