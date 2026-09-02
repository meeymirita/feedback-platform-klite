<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import EntryModal from '@/components/report/EntryModal.vue'
import { useReportEntriesStore } from '@/stores/reportEntries'
import type { ReportEntry } from '@/types/report.ts'

const store = useReportEntriesStore()
const { days } = storeToRefs(store)
// экшены берём напрямую со store — через storeToRefs они не проходят
const { addEntry, updateEntry, deleteEntry } = store

const showEntryModal = ref(false)
const editing = ref<ReportEntry | null>(null)

function openCreate() {
  editing.value = null
  showEntryModal.value = true
}
function openEdit(row: ReportEntry) {
  editing.value = row
  showEntryModal.value = true
}
function onSubmit(data: Omit<ReportEntry, 'id'>) {
  if (editing.value) updateEntry(editing.value.id, data)
  else addEntry(data)
}
function onDelete(row: ReportEntry) {
  if (confirm(`Удалить запись «${row.domain}»?`)) deleteEntry(row.id)
}
</script>

<template>
  <main class="min-w-0 flex-1 px-8 py-7">
    <div class="mx-auto flex max-w-[1020px] flex-col gap-5">
      <!-- Заголовок -->
      <div class="flex flex-wrap items-end justify-between gap-6">
        <div class="flex flex-col gap-1.5">
          <h1 class="text-[21px] font-semibold tracking-[-0.01em]">Мои записи</h1>
          <p class="text-[13px] text-[#6b7280]">
            Одна задача — одна запись. Редактировать можно за любой прошедший день.
          </p>
        </div>
        <button
          class="h-[38px] rounded-lg bg-brand px-4 text-[13.5px] font-medium text-white hover:bg-brand-hover"
          @click="openCreate"
        >
          ＋ Добавить запись
        </button>
      </div>

      <!-- Неделя -->
      <div
        class="flex items-center justify-between gap-4 rounded-[9px] border border-[#e6e8ed] bg-white px-3.5 py-2.5"
      >
        <div class="flex items-center gap-2.5">
          <button class="h-[30px] w-[30px] rounded-md border border-line hover:border-brand">
            ←
          </button>
          <span class="min-w-[172px] text-center font-mono text-[13px] font-medium">
            31.08 — 04.09.2026
          </span>
          <button class="h-[30px] w-[30px] rounded-md border border-line hover:border-brand">
            →
          </button>
          <span class="text-xs text-[#9aa1ad]">текущая неделя</span>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-xs text-[#6b7280]">Итого за неделю</span>
          <span class="font-mono text-[15px] font-medium">27:35</span>
        </div>
      </div>

      <!-- Дни -->
      <div class="flex flex-col gap-3">
        <div
          v-for="day in days"
          :key="day.date"
          class="overflow-hidden rounded-[9px] border border-[#e6e8ed] bg-white"
        >
          <!-- Шапка дня -->
          <div
            class="flex items-center justify-between gap-4 border-b border-[#eceef2] bg-[#fafbfc] px-4 py-2.5"
          >
            <div class="flex items-baseline gap-2.5">
              <span class="text-[13.5px] font-semibold">{{ day.name }}</span>
              <span class="font-mono text-xs text-[#9aa1ad]">{{ day.date }}</span>
              <span class="text-xs text-[#9aa1ad]">{{ day.rows.length }} записи</span>
            </div>
            <span class="font-mono text-[13px] font-medium">{{ day.total }}</span>
          </div>

          <!-- Строки -->
          <div
            v-for="row in day.rows"
            :key="row.id"
            class="grid grid-cols-[170px_1fr_78px_130px] items-start gap-4 border-t border-[#f1f2f5] px-4 py-3 first:border-t-0 hover:bg-[#fafbfc]"
          >
            <div class="min-w-0">
              <div class="truncate text-[13.5px] font-medium">{{ row.domain }}</div>
              <a href="#" class="font-mono text-[11px] text-brand hover:underline">
                {{ row.link }}
              </a>
            </div>
            <div class="text-[13px] leading-relaxed text-[#3d434c] text-pretty">
              {{ row.desc }}
            </div>
            <div class="text-right font-mono text-[13.5px]">{{ row.time }}</div>
            <div class="flex justify-end gap-3">
              <button @click="openEdit(row)" class="text-[12.5px] text-[#6b7280] hover:text-brand">
                Изменить
              </button>
              <button
                @click="onDelete(row)"
                class="text-[12.5px] text-[#9aa1ad] hover:text-[#c8442f]"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
  <EntryModal
    v-if="showEntryModal"
    :entry="editing ?? undefined"
    @submit="onSubmit"
    @close="showEntryModal = false"
  />
</template>
