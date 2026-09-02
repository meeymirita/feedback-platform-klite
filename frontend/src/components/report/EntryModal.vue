<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import type { ReportEntry } from '@/types/report'
import { toMinutes, fromMinutes } from '@/utils/time'
import { toISODate, fromISODate, todayISO, isWeekend } from '@/utils/date'

const props = defineProps<{ entry?: ReportEntry }>()
// employeeId проставляет родитель (EntriesView) — модалка про сотрудника не знает
const emit = defineEmits<{ close: []; submit: [data: Omit<ReportEntry, 'id' | 'employeeId'>] }>()

const field = 'h-[38px] rounded-lg border border-line px-3 text-sm outline-none focus:border-brand'
const invalid = '!border-[#c8442f]' // рамка невалидного поля

const isEdit = !!props.entry

const form = reactive({
  date: props.entry ? toISODate(props.entry.date) : todayISO(),
  domain: props.entry?.domain ?? '',
  link: props.entry?.link ?? '',
  desc: props.entry?.desc ?? '',
  time: props.entry?.time ?? '1:00',
})
// props.entry не реактивен между открытиями — модалка каждый раз монтируется
// заново (v-if во вьюхе), поэтому watch не нужен.

const timeOk = (t: string) => /^\d{1,2}:[0-5]\d$/.test(t) && toMinutes(t) > 0
const errors = computed(() => ({
  date: !form.date || isWeekend(form.date), // рабочая неделя Пн–Пт
  domain: !form.domain.trim(),
  desc: !form.desc.trim(),
  time: !timeOk(form.time),
}))
const hasErrors = computed(() => Object.values(errors.value).some(Boolean))

// рамки-ошибки показываем только после первой попытки сохранить
const submitted = ref(false)
const showError = (key: keyof typeof errors.value) => submitted.value && errors.value[key]

function bump(delta: number) {
  form.time = fromMinutes(Math.max(0, toMinutes(form.time) + delta))
}
function save() {
  if (hasErrors.value) {
    submitted.value = true
    return
  }
  emit('submit', {
    date: fromISODate(form.date),
    domain: form.domain.trim(),
    link: form.link.trim(),
    desc: form.desc.trim(),
    time: form.time,
  })
  emit('close')
}
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
          <div class="text-base font-semibold">
            {{ isEdit ? 'Изменить запись' : 'Новая запись' }}
          </div>
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
            <input type="date" v-model="form.date" :class="[field, showError('date') && invalid]" />
            <span v-if="showError('date')" class="text-[11px] text-[#c8442f]">
              Рабочий день, Пн–Пт
            </span>
          </label>
          <label class="flex flex-col gap-1.5">
            <span class="text-xs font-medium text-[#4b5563]">Домен проекта</span>
            <input
              v-model="form.domain"
              :class="[field, showError('domain') && invalid]"
              placeholder="ggs-service.ru"
            />
          </label>
        </div>

        <label class="flex flex-col gap-1.5">
          <span class="text-xs font-medium text-[#4b5563]">Ссылка на задачу</span>
          <input
            v-model="form.link"
            :class="field"
            class="font-mono !text-[12.5px]"
            placeholder="https://kontur.bitrix24.ru/.../task/view/123123123/"
          />
        </label>

        <label class="flex flex-col gap-1.5">
          <span class="text-xs font-medium text-[#4b5563]">Что сделал</span>
          <textarea
            rows="3"
            v-model="form.desc"
            :class="showError('desc') && invalid"
            class="resize-y rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
            placeholder="Коротко по факту: что именно сделано"
          ></textarea>
        </label>

        <div class="flex flex-col gap-2">
          <span class="text-xs font-medium text-[#4b5563]">Время на задачу</span>
          <div class="flex items-center gap-2">
            <button
              @click="bump(-30)"
              class="h-[38px] w-9 rounded-lg border border-line text-lg hover:border-brand"
            >
              −
            </button>
            <input
              v-model="form.time"
              class="h-[38px] w-[86px] rounded-lg border border-line text-center font-mono text-sm outline-none focus:border-brand"
            />
            <button
              @click="bump(30)"
              class="h-[38px] w-9 rounded-lg border border-line text-lg hover:border-brand"
            >
              +
            </button>
            <div class="ml-2 flex gap-1.5">
              <button
                v-for="t in ['0:30', '1:00', '2:00', '4:00']"
                :key="t"
                @click="form.time = t"
                class="h-[30px] rounded-md border border-line px-2.5 font-mono text-xs text-[#4b5563] hover:border-brand hover:text-brand"
              >
                {{ t }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Низ -->
      <div class="flex justify-end gap-2 border-t border-[#eceef2] bg-[#fafbfc] px-5 py-3.5">
        <button
          class="h-[38px] rounded-lg border border-line bg-white px-3.5 text-sm hover:border-[#9aa1ad]"
          @click="$emit('close')"
        >
          Отмена
        </button>
        <button
          @click="save"
          class="h-[38px] rounded-lg bg-brand px-4 text-sm font-medium text-white hover:bg-brand-hover"
        >
          Сохранить
        </button>
      </div>
    </div>
  </div>
</template>
