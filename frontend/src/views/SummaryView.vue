<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useSummaryStore } from '@/stores/summary'
import { useReportEntriesStore } from '@/stores/reportEntries'

const { summary: rows, companyCount, companyTotal } = storeToRefs(useSummaryStore())

const reportEntries = useReportEntriesStore()
const { weekLabel, canGoNext } = storeToRefs(reportEntries)
const { prevWeek, nextWeek } = reportEntries
</script>

<template>
  <main class="min-w-0 flex-1 px-8 py-7">
    <div class="mx-auto flex max-w-[1020px] flex-col gap-5">
      <!-- Заголовок -->
      <div class="flex flex-wrap items-end justify-between gap-6">
        <div class="flex flex-col gap-1.5">
          <h1 class="text-[21px] font-semibold tracking-[-0.01em]">Сводный отчёт за неделю</h1>
          <p class="text-[13px] text-[#6b7280]">
            Клик по строке открывает детальный отчёт сотрудника.
          </p>
        </div>
        <button
          class="h-[38px] rounded-lg bg-ink px-4 text-[13.5px] font-medium text-white hover:bg-black"
        >
          Скачать по всем
        </button>
      </div>

      <!-- Неделя -->
      <div
        class="flex items-center justify-between gap-4 rounded-[9px] border border-[#e6e8ed] bg-white px-3.5 py-2.5"
      >
        <div class="flex items-center gap-2.5">
          <button
            @click="prevWeek"
            class="h-[30px] w-[30px] rounded-md border border-line hover:border-brand"
          >
            ←
          </button>
          <span class="min-w-[172px] text-center font-mono text-[13px] font-medium">
            {{ weekLabel }}
          </span>
          <button
            @click="nextWeek"
            :disabled="!canGoNext"
            class="h-[30px] w-[30px] rounded-md border border-line hover:border-brand disabled:cursor-not-allowed disabled:opacity-40"
          >
            →
          </button>
        </div>
        <span class="text-xs text-[#6b7280]">Один файл, лист на каждого сотрудника</span>
      </div>

      <!-- Таблица -->
      <div class="overflow-hidden rounded-[9px] border border-[#e6e8ed] bg-white">
        <div
          class="grid grid-cols-[1fr_120px_150px_170px] gap-3.5 border-b border-[#e6e8ed] bg-[#fafbfc] px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.06em] text-[#6b7280]"
        >
          <div>Сотрудник</div>
          <div class="text-right">Записей</div>
          <div class="text-right">Время за неделю</div>
          <div class="text-right">Загрузка</div>
        </div>

        <RouterLink
          v-for="row in rows"
          :key="row.id"
          :to="{ name: 'employee-weekly', params: { id: row.id } }"
          class="grid grid-cols-[1fr_120px_150px_170px] items-center gap-3.5 border-t border-[#f1f2f5] px-4 py-3 hover:bg-[#f7f8fb]"
        >
          <div class="flex min-w-0 items-center gap-2.5">
            <div
              class="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[#eceef2] text-[11px] font-semibold text-[#4b5563]"
            >
              {{ row.initials }}
            </div>
            <div class="truncate text-[13.5px] font-medium">{{ row.name }}</div>
          </div>

          <div class="text-right font-mono text-[13px] text-[#4b5563]">{{ row.count }}</div>
          <div
            class="text-right font-mono text-[14px] font-medium"
            :class="{ 'text-[#9aa1ad]': row.pct === 0 }"
          >
            {{ row.total }}
          </div>

          <div class="flex items-center justify-end gap-2">
            <div class="h-1.5 w-16 overflow-hidden rounded bg-[#eceef2]">
              <div class="h-full rounded bg-[#dd9089]" :style="{ width: row.pct + '%' }"></div>
            </div>
            <span class="min-w-[30px] text-right text-[11.5px] text-[#6b7280]">
              {{ row.pct }}%
            </span>
          </div>
        </RouterLink>

        <!-- Итог -->
        <div class="grid grid-cols-[1fr_120px_150px] gap-3.5 bg-ink px-4 py-3.5 text-white">
          <div class="text-[13px] font-semibold">Всего по компании</div>
          <div class="text-right font-mono text-[13px] text-[#9aa1ad]">{{ companyCount }}</div>
          <div class="text-right font-mono text-[15px] font-medium">{{ companyTotal }}</div>
        </div>
      </div>
    </div>
  </main>
</template>
