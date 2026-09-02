<script setup lang="ts">
// Просмотр одной записи целиком (описания у нас длинные — в таблице не помещаются).
import type { ReportEntry } from '@/types/report'
import { weekdayName } from '@/utils/date'

const props = defineProps<{ entry: ReportEntry }>()
defineEmits<{ close: [] }>()

const isUrl = (s: string) => /^https?:\/\//i.test(s)
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/40 p-16 font-sans"
    @click.self="$emit('close')"
  >
    <div class="w-full max-w-[560px] overflow-hidden rounded-xl bg-white shadow-2xl">
      <!-- Шапка -->
      <div class="flex items-start justify-between gap-4 border-b border-[#eceef2] px-5 py-4">
        <div class="min-w-0">
          <div class="truncate text-base font-semibold">{{ props.entry.domain }}</div>
          <div class="text-xs text-[#6b7280]">
            {{ weekdayName(props.entry.date) }}, {{ props.entry.date }} · {{ props.entry.time }}
          </div>
        </div>
        <button
          class="flex h-7 w-7 flex-none items-center justify-center rounded-md bg-[#f4f5f7] text-[#6b7280] hover:bg-[#eceef2]"
          @click="$emit('close')"
        >
          ✕
        </button>
      </div>

      <!-- Тело -->
      <div class="flex flex-col gap-4 px-5 py-5">
        <div class="flex flex-col gap-1">
          <span class="text-xs font-medium text-[#4b5563]">Ссылка на задачу</span>
          <a
            v-if="isUrl(props.entry.link)"
            :href="props.entry.link"
            target="_blank"
            rel="noopener"
            class="break-all font-mono text-[12px] text-brand hover:underline"
          >
            {{ props.entry.link }}
          </a>
          <span v-else class="break-all font-mono text-[12px] text-[#6b7280]">
            {{ props.entry.link || '—' }}
          </span>
        </div>

        <div class="flex flex-col gap-1">
          <span class="text-xs font-medium text-[#4b5563]">Что сделал</span>
          <p class="whitespace-pre-line text-[13.5px] leading-relaxed text-[#3d434c] text-pretty">
            {{ props.entry.desc }}
          </p>
        </div>
      </div>

      <!-- Подвал -->
      <div class="flex justify-end border-t border-[#eceef2] bg-[#fafbfc] px-5 py-3.5">
        <button
          class="h-[38px] rounded-lg border border-line bg-white px-4 text-sm hover:border-[#9aa1ad]"
          @click="$emit('close')"
        >
          Закрыть
        </button>
      </div>
    </div>
  </div>
</template>
