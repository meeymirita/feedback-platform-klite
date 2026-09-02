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
   ЗАДАЧА ВЕТКИ frontend/entry-modal   (заметка временная, удалить по готовности)

   Оживить EntryModal: v-model + валидация + сабмит → CRUD-экшены стора
   reportEntries. Кнопки «Изменить» / «Удалить» на строках в EntriesView.
   Модалка САМА в стор не ходит — отдаёт наружу готовый payload, add/update
   решает родитель (EntriesView).

   Трогаем 3 файла: utils/date.ts, components/report/EntryModal.vue,
   views/EntriesView.vue. Типы (ReportEntry) и utils/time.ts уже готовы.

   ─────────────────────────────────────────────────────────────────────────────
   1. src/utils/date.ts — дописать 2 хелпера (weekdayName не трогаем)

   // '31.08.2026' -> '2026-08-31'  (в <input type="date">)
   export function toISODate(dmy: string): string {
     const [d, m, y] = dmy.split('.')
     return `${y}-${m}-${d}`
   }
   // '2026-08-31' -> '31.08.2026'  (обратно, в стор)
   export function fromISODate(iso: string): string {
     const [y, m, d] = iso.split('-')
     return `${d}.${m}.${y}`
   }

   ─────────────────────────────────────────────────────────────────────────────
   2. src/components/report/EntryModal.vue

   <script setup>:
     import { reactive, computed } from 'vue'
     import type { ReportEntry } from '@/types/report'
     import { toMinutes, fromMinutes } from '@/utils/time'
     import { toISODate, fromISODate } from '@/utils/date'

     const props = defineProps<{ entry?: ReportEntry }>()
     const emit  = defineEmits<{ close: []; submit: [data: Omit<ReportEntry, 'id'>] }>()

     const isEdit = !!props.entry
     const form = reactive({
       date:   props.entry ? toISODate(props.entry.date) : new Date().toISOString().slice(0, 10),
       domain: props.entry?.domain ?? '',
       link:   props.entry?.link   ?? '',
       desc:   props.entry?.desc   ?? '',
       time:   props.entry?.time   ?? '1:00',
     })
     // props.entry не реактивен между открытиями — модалка каждый раз монтируется
     // заново (v-if во вьюхе), поэтому watch не нужен.

     const timeOk = (t: string) => /^\d{1,2}:[0-5]\d$/.test(t) && toMinutes(t) > 0
     const errors = computed(() => ({
       date:   !form.date,
       domain: !form.domain.trim(),
       desc:   !form.desc.trim(),
       time:   !timeOk(form.time),
     }))
     const hasErrors = computed(() => Object.values(errors.value).some(Boolean))

     function bump(delta: number) {
       form.time = fromMinutes(Math.max(0, toMinutes(form.time) + delta))
     }
     function save() {
       if (hasErrors.value) return
       emit('submit', {
         date:   fromISODate(form.date),
         domain: form.domain.trim(),
         link:   form.link.trim(),
         desc:   form.desc.trim(),
         time:   form.time,
       })
       emit('close')
     }

   <template> — по текущей вёрстке, точечно:
     • Шапка: "Новая запись" -> {{ isEdit ? 'Изменить запись' : 'Новая запись' }}
       подпись оставить как есть.
     • Дата:    <input type="date" v-model="form.date"   :class="[field, errors.date   && invalid]" />
     • Домен:   <input           v-model="form.domain"   :class="[field, errors.domain && invalid]" />
     • Ссылка:  <input           v-model="form.link"      :class="field" class="font-mono !text-[12.5px]" />
     • Что сделал: <textarea     v-model="form.desc"      :class="errors.desc && invalid" ...>
                   (длинную класс-строку textarea оставить как есть, invalid добавить
                   отдельным :class-биндингом)
     • Время:
         кнопка «−»  @click="bump(-30)"
         <input v-model="form.time" ...>  (убрать value="1:00")
         кнопка «+»  @click="bump(30)"
         быстрые кнопки:  @click="form.time = t"
     • Низ: кнопка «Сохранить»  @click="save"  :disabled="hasErrors"
            добавить в класс:  disabled:cursor-not-allowed disabled:opacity-50
     • Рядом с const field добавить:
         const invalid = '!border-[#c8442f]'
       (border-line у field перебивается через !)

   ─────────────────────────────────────────────────────────────────────────────
   3. src/views/EntriesView.vue

   <script setup>:
     const store = useReportEntriesStore()
     const { days } = storeToRefs(store)
     const { addEntry, updateEntry, deleteEntry } = store   // экшены берём прямо со store,
                                                            // через storeToRefs они не идут

     const showEntryModal = ref(false)
     const editing = ref<ReportEntry | null>(null)          // import type { ReportEntry } from '@/types/report'

     function openCreate() { editing.value = null;  showEntryModal.value = true }
     function openEdit(row: ReportEntry) { editing.value = row; showEntryModal.value = true }
     function onSubmit(data: Omit<ReportEntry, 'id'>) {
       if (editing.value) updateEntry(editing.value.id, data)
       else addEntry(data)
     }
     function onDelete(row: ReportEntry) {
       if (confirm(`Удалить запись «${row.domain}»?`)) deleteEntry(row.id)
     }

   <template>:
     • «＋ Добавить запись»:  @click="showEntryModal = true"  ->  @click="openCreate"
     • строки дня:  :key="i"  ->  :key="row.id"   (и убрать (row, i), оставить row)
     • «Изменить»:  @click="openEdit(row)"
     • «Удалить»:   @click="onDelete(row)"
     • модалка внизу:
         <EntryModal
           v-if="showEntryModal"
           :entry="editing ?? undefined"
           @submit="onSubmit"
           @close="showEntryModal = false"
         />

   ─────────────────────────────────────────────────────────────────────────────
   НЕ ТРОГАЕМ в этой ветке
     • EmployeeModal / PasswordModal, «войти как …» — отдельные ветки.
     • «Итого за неделю» (27:35 хардкод в EntriesView) и стрелки недели — уйдут
       с недельным отчётом; сумма ДНЯ (day.total) и счётчик записей в шапке дня
       пересчитываются сами (days — computed в сторе).
     • Excel-экспорт, реальный URL для link (пока это строка-метка), API-слой.
     • ISO-даты/минуты числом в модели — вместе с бэком.

   ПРОВЕРКА
     npm run type-check && npm run lint && npm run build
     npm run dev, экран «Мои записи»:
       — «Добавить запись» → заполнить → «Сохранить»: строка появилась в нужном
         дне, сумма дня и счётчик записей обновились;
       — «Изменить» на строке: поля предзаполнены, дата в правильном дне, после
         сохранения запись изменилась (день мог смениться, если поменяли дату);
       — «Удалить»: подтверждение → строка исчезла, суммы пересчитались;
       — те же данные на экране «Недельный отчёт» (общий стор).
       — «Сохранить» неактивна, пока есть пустая дата/домен/описание или кривое
         время; кривое поле — красная рамка.

   ПОСЛЕ ГОТОВНОСТИ
     • docs/CHECKLIST.md: пункт «Модалки … EntryModal» — из [~] в [x] (или отдельным
       [x] «EntryModal: v-model + валидация + сабмит»).
     • Удалить эту заметку из router/index.ts.
═════════════════════════════════════════════════════════════════════════════ */
