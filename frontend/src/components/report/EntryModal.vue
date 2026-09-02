<script setup lang="ts">
// Модалка записи. Сейчас — только вёрстка формы (см. спеку ветки внизу файла).
defineEmits<{ close: [] }>()

const field =
  'h-[38px] rounded-lg border border-line px-3 text-sm outline-none focus:border-brand'
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/40 p-16 font-sans"
    @click.self="$emit('close')"
  >
    <div class="w-full max-w-[520px] overflow-hidden rounded-xl bg-white shadow-2xl">
      <!-- Шапка -->
      <div class="flex items-center justify-between border-b border-[#eceef2] px-5 py-4">
        <div>
          <div class="text-base font-semibold">Новая запись</div>
          <div class="text-xs text-[#6b7280]">Одна задача = одна запись</div>
        </div>
        <button
          class="flex h-7 w-7 items-center justify-center rounded-md bg-[#f4f5f7] text-[#6b7280] hover:bg-[#eceef2]"
          @click="$emit('close')"
        >
          ✕
        </button>
      </div>

      <!-- Тело -->
      <div class="flex flex-col gap-4 px-5 py-5">
        <div class="grid grid-cols-2 gap-3.5">
          <label class="flex flex-col gap-1.5">
            <span class="text-xs font-medium text-[#4b5563]">Дата</span>
            <input type="date" :class="field" />
          </label>
          <label class="flex flex-col gap-1.5">
            <span class="text-xs font-medium text-[#4b5563]">Домен проекта</span>
            <input :class="field" placeholder="ggs-service.ru" />
          </label>
        </div>

        <label class="flex flex-col gap-1.5">
          <span class="text-xs font-medium text-[#4b5563]">Ссылка на задачу</span>
          <input
            :class="field"
            class="font-mono !text-[12.5px]"
            placeholder="https://kontur.bitrix24.ru/.../task/view/123123123/"
          />
        </label>

        <label class="flex flex-col gap-1.5">
          <span class="text-xs font-medium text-[#4b5563]">Что сделал</span>
          <textarea
            rows="3"
            class="resize-y rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
            placeholder="Коротко по факту: что именно сделано"
          ></textarea>
        </label>

        <div class="flex flex-col gap-2">
          <span class="text-xs font-medium text-[#4b5563]">Время на задачу</span>
          <div class="flex items-center gap-2">
            <button class="h-[38px] w-9 rounded-lg border border-line text-lg hover:border-brand">
              −
            </button>
            <input
              value="1:00"
              class="h-[38px] w-[86px] rounded-lg border border-line text-center font-mono text-sm outline-none focus:border-brand"
            />
            <button class="h-[38px] w-9 rounded-lg border border-line text-lg hover:border-brand">
              +
            </button>
            <div class="ml-2 flex gap-1.5">
              <button
                v-for="t in ['0:30', '1:00', '2:00', '4:00']"
                :key="t"
                class="h-[30px] rounded-md border border-line px-2.5 font-mono text-xs text-[#4b5563] hover:border-brand hover:text-brand"
              >
                {{ t }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Низ -->
      <div
        class="flex justify-end gap-2 border-t border-[#eceef2] bg-[#fafbfc] px-5 py-3.5"
      >
        <button
          class="h-[38px] rounded-lg border border-line bg-white px-3.5 text-sm hover:border-[#9aa1ad]"
          @click="$emit('close')"
        >
          Отмена
        </button>
        <button
          class="h-[38px] rounded-lg bg-brand px-4 text-sm font-medium text-white hover:bg-brand-hover"
        >
          Сохранить
        </button>
      </div>
    </div>
  </div>
</template>

<!-- ─────────────────────────────────────────────────────────────────────────────
   ЗАДАЧА ВЕТКИ frontend/entry-modal  (заметка временная, удалить по готовности)

   Цель: оживить EntryModal — v-model, валидация, сабмит → CRUD-экшены стора
   reportEntries. Плюс кнопки «Изменить» / «Удалить» на строках в EntriesView.
   Модалка не ходит в стор сама — отдаёт наружу готовый payload, решает родитель.

   ── 1. src/utils/date.ts — добавить два хелпера ─────────────────────────────
   // '31.08.2026' -> '2026-08-31'  (для <input type="date">)
   export function toISODate(dmy: string): string {
     const [d, m, y] = dmy.split('.')
     return `${y}-${m}-${d}`
   }
   // '2026-08-31' -> '31.08.2026'  (обратно, для стора)
   export function fromISODate(iso: string): string {
     const [y, m, d] = iso.split('-')
     return `${d}.${m}.${y}`
   }

   ── 2. src/components/report/EntryModal.vue ────────────────────────────────
   defineProps<{ entry?: ReportEntry }>()        // есть -> режим правки, нет -> создание
   defineEmits<{ close: []; submit: [data: Omit<ReportEntry, 'id'>] }>()

   • form = reactive({ date, domain, link, desc, time }) — тип полей string.
     Инициализация: из props.entry (date -> toISODate), иначе пусто + time '1:00',
     date — сегодня (new Date().toISOString().slice(0,10)).
   • Шапка: заголовок/подзаголовок по режиму ('Новая запись' / 'Изменить запись').
   • Время:
       − / +  ->  form.time = fromMinutes(Math.max(0, toMinutes(form.time) ± 30))
       быстрые кнопки ['0:30','1:00','2:00','4:00'] -> form.time = t
       поле <input v-model="form.time"> вместо value="1:00"
   • Валидация (мин.), считаем на computed `errors`:
       date  — непустая
       domain — непустая (trim)
       desc  — непустая (trim)
       time  — /^\d{1,2}:[0-5]\d$/ и toMinutes > 0
     link — не обязателен, пишем как есть (это метка, не URL — по типу).
   • «Сохранить»: :disabled при наличии ошибок; по клику
       emit('submit', { ...form, date: fromISODate(form.date) }); emit('close')
   • Невалидные поля — рамка red-ish (добавить класс по условию, границу менять
     на border-[#c8442f]); показывать текст ошибки не обязательно.

   ── 3. src/views/EntriesView.vue ──────────────────────────────────────────
   const store = useReportEntriesStore()
   const { days } = storeToRefs(store)
   const { addEntry, updateEntry, deleteEntry } = store   // экшены — прямо со store

   const editing = ref<ReportEntry | null>(null)
   function openCreate() { editing.value = null;  showEntryModal.value = true }
   function openEdit(row: ReportEntry) { editing.value = row; showEntryModal.value = true }
   function onSubmit(data: Omit<ReportEntry, 'id'>) {
     if (editing.value) updateEntry(editing.value.id, data)
     else addEntry(data)
   }

   • Кнопка «＋ Добавить запись» -> openCreate.
   • «Изменить» -> openEdit(row);  «Удалить» -> deleteEntry(row.id) (можно confirm()).
   • v-for по day.rows: :key="i" -> :key="row.id".
   • <EntryModal v-if="showEntryModal" :entry="editing ?? undefined"
        @submit="onSubmit" @close="showEntryModal = false" />

   ── НЕ ТРОГАТЬ в этой ветке ─────────────────────────────────────────────────
   • EmployeeModal / PasswordModal, «войти как …» — следующие ветки.
   • «Итого за неделю» (27:35 хардкод в EntriesView) и стрелки недели — с недельным
     отчётом отдельно; сумма ДНЯ (day.total) пересчитывается сама из стора.
   • Excel-экспорт, реальный URL для link, API-слой.

   ── ПРОВЕРКА ───────────────────────────────────────────────────────────────
   npm run type-check && npm run lint && npm run build
   npm run dev — на «Мои записи»: добавить / изменить / удалить запись; сумма дня
   и число записей в шапке дня пересчитываются; правки видны и в «Недельном отчёте».

   ── ПОСЛЕ ГОТОВНОСТИ ───────────────────────────────────────────────────────
   • Отметить пункт «Модалки … EntryModal» в docs/CHECKLIST.md.
   • Удалить эту заметку.
───────────────────────────────────────────────────────────────────────────── -->

