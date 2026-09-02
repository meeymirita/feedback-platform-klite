<script setup lang="ts">
import { computed, ref, watchEffect, onBeforeUnmount, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { useReportEntriesStore } from '@/stores/reportEntries'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'
import { listUsers } from '@/api/users'
import { plural } from '@/utils/plural'

const route = useRoute()
const store = useReportEntriesStore()
const auth = useAuthStore()
const notify = useNotificationsStore()
const { days, weekLabel, weekTotal, weekCount, canGoNext } = storeToRefs(store)
const { prevWeek, nextWeek } = store

// drill-down: /employees/:id/weekly показывает чужой отчёт; обычный /weekly — мой
const drillId = computed(() => (route.params.id ? String(route.params.id) : undefined))
watchEffect(() => store.setViewEmployee(drillId.value))
onBeforeUnmount(() => store.setViewEmployee()) // вернуть просмотр на «меня»
onMounted(() => store.load().catch(() => notify.error('Не удалось загрузить отчёт')))

// имя в шапке: своё — из authStore; чужое (drill-down) — из списка сотрудников
const drillName = ref('')
watchEffect(async () => {
  if (!drillId.value) {
    drillName.value = ''
    return
  }
  const users = await listUsers()
  drillName.value = users.find((u) => u.id === drillId.value)?.displayName ?? '—'
})
const employeeName = computed(() =>
  drillId.value ? drillName.value : (auth.user?.displayName ?? ''),
)
</script>

<template>
  <main class="min-w-0 flex-1 px-8 py-7">
    <div class="mx-auto flex max-w-[1020px] flex-col gap-5">
      <!-- Заголовок -->
      <div class="flex flex-wrap items-end justify-between gap-6">
        <div class="flex flex-col gap-1.5">
          <RouterLink
            v-if="drillId"
            :to="{ name: 'summary' }"
            class="text-[12px] text-[#6b7280] hover:text-brand"
          >
            ← Сводный отчёт
          </RouterLink>
          <h1 class="text-[21px] font-semibold tracking-[-0.01em]">Недельный отчёт</h1>
          <p class="text-[13px] text-[#6b7280]">
            Рабочая неделя Пн–Пт. Только просмотр и выгрузка.
          </p>
        </div>
        <button
          class="h-[38px] rounded-lg bg-ink px-4 text-[13.5px] font-medium text-white hover:bg-black"
        >
          Скачать в Excel
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
        <span class="text-xs text-[#6b7280]">{{ employeeName }}</span>
      </div>

      <!-- Таблица -->
      <div class="overflow-hidden rounded-[9px] border border-[#e6e8ed] bg-white">
        <!-- Шапка таблицы -->
        <div
          class="grid grid-cols-[150px_1fr_320px_96px] gap-4 border-b border-[#e6e8ed] bg-[#fafbfc] px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.06em] text-[#6b7280]"
        >
          <div>День</div>
          <div>Задача · что сделал</div>
          <div>Ссылка</div>
          <div class="text-right">Время</div>
        </div>

        <!-- Группы по дням -->
        <div v-for="day in days" :key="day.date" class="border-b border-[#eceef2]">
          <div
            v-for="(row, i) in day.rows"
            :key="row.id"
            class="grid grid-cols-[150px_1fr_320px_96px] gap-4 border-t border-[#f4f5f7] px-4 py-2.5 first:border-t-0"
          >
            <div class="text-[13.5px]" :class="i === 0 ? 'font-semibold' : 'text-[#9aa1ad]'">
              {{ i === 0 ? day.name : '' }}
            </div>
            <div class="min-w-0 text-[13.5px]">
              <div class="font-medium">{{ row.domain }}</div>
              <div class="text-[12.5px] leading-relaxed text-[#6b7280] text-pretty">
                {{ row.desc }}
              </div>
            </div>
            <a href="#" class="truncate font-mono text-[11.5px] text-brand hover:underline">
              {{ row.link }}
            </a>
            <div class="text-right font-mono text-[13.5px]">{{ row.time }}</div>
          </div>

          <!-- Итог по дню -->
          <div
            class="grid grid-cols-[150px_1fr_96px] gap-4 border-t border-[#eceef2] bg-[#f7f8fb] px-4 py-2"
          >
            <div></div>
            <div class="text-right text-xs text-[#6b7280]">Итого за день</div>
            <div class="text-right font-mono text-[13px] font-medium">{{ day.total }}</div>
          </div>
        </div>

        <!-- Итог за неделю -->
        <div class="grid grid-cols-[1fr_96px] gap-4 bg-ink px-4 py-3.5 text-white">
          <div class="text-[13px] font-semibold">
            Итого за неделю · {{ weekCount }} {{ plural(weekCount, ['запись', 'записи', 'записей']) }}
          </div>
          <div class="text-right font-mono text-[15px] font-medium">{{ weekTotal }}</div>
        </div>
      </div>
    </div>
  </main>
</template>
