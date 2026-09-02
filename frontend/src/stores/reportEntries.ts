import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import type { ReportEntry, ReportDay } from '@/types/report'
import { useAuthStore } from '@/stores/auth'
import * as entriesApi from '@/api/reportEntries'
import { toMinutes, fromMinutes } from '@/utils/time'
import {
  weekdayName,
  parseDmy,
  addDays,
  mondayOf,
  weekRangeLabel,
  toISODate,
  fromISODate,
} from '@/utils/date'

// Раньше это был id демо-сотрудника. Оставлен, чтобы EntriesView не переписывать —
// бэкенд всё равно берёт автора записи из сессии.
export const MY_EMPLOYEE_ID = ''

// Date -> 'YYYY-MM-DD' по локальным частям (без сдвига на UTC).
function isoLocal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// Запись с бэка -> форма, в которой её ждут вьюхи (dmy-дата, время 'ч:мм', desc).
function toRow(e: entriesApi.ApiEntry): ReportEntry {
  return {
    id: e.id,
    employeeId: e.userId,
    date: fromISODate(e.date.slice(0, 10)),
    domain: e.domain,
    link: e.link,
    desc: e.description,
    time: fromMinutes(e.minutes),
  }
}

export const useReportEntriesStore = defineStore('reportEntries', () => {
  const auth = useAuthStore()

  // Записи текущей выбранной недели (только мои — бэкенд другого не отдаёт).
  const rows = ref<ReportEntry[]>([])

  const weekOffset = ref(0) // 0 — неделя с «сегодня», −1 предыдущая, …
  const weekStart = computed(() => addDays(mondayOf(new Date()), weekOffset.value * 7))
  const isCurrentWeek = computed(() => weekOffset.value === 0)
  const canGoNext = computed(() => weekOffset.value < 0) // вперёд текущей не пускаем
  const weekLabel = computed(() => weekRangeLabel(weekStart.value))

  // Чей отчёт смотрим. Пока всегда мой; drill-down чужого — этап «Сводный отчёт».
  const viewEmployeeId = ref('')
  function setViewEmployee(id?: string) {
    viewEmployeeId.value = id || auth.user?.id || ''
  }

  // Загрузка записей выбранной недели с бэкенда.
  async function load() {
    const from = isoLocal(weekStart.value)
    const to = isoLocal(addDays(weekStart.value, 6)) // Пн..Вс включительно
    const list = await entriesApi.listEntries(from, to)
    rows.value = list.map(toRow)
  }

  // при смене недели — перезагрузка
  watch(weekStart, () => {
    void load()
  })

  function prevWeek() {
    weekOffset.value--
  }
  function nextWeek() {
    if (canGoNext.value) weekOffset.value++
  }

  // Записи недели, сгруппированные по дням (Пн→Пт по порядку).
  const days = computed<ReportDay[]>(() => {
    const byDate = new Map<string, ReportEntry[]>()
    for (const e of rows.value) {
      if (!byDate.has(e.date)) byDate.set(e.date, [])
      byDate.get(e.date)!.push(e)
    }
    return [...byDate.entries()]
      .sort((a, b) => +parseDmy(a[0]) - +parseDmy(b[0]))
      .map(([date, list]) => ({
        name: weekdayName(date),
        date,
        total: fromMinutes(list.reduce((s, r) => s + toMinutes(r.time), 0)),
        rows: list,
      }))
  })

  const weekTotal = computed(() =>
    fromMinutes(rows.value.reduce((s, e) => s + toMinutes(e.time), 0)),
  )
  const weekCount = computed(() => rows.value.length)

  // Совместимость со stores/summary (сводный отчёт). Пока это только мои записи —
  // корректные данные для сводного появятся на этапе «Сводный отчёт».
  const weekEntriesAll = computed(() => rows.value)

  async function addEntry(data: Omit<ReportEntry, 'id' | 'employeeId'>) {
    await entriesApi.createEntry({
      date: toISODate(data.date),
      domain: data.domain,
      link: data.link,
      description: data.desc,
      minutes: toMinutes(data.time),
    })
    await load()
  }

  async function updateEntry(id: string, patch: Partial<Omit<ReportEntry, 'id' | 'employeeId'>>) {
    await entriesApi.updateEntry(id, {
      date: patch.date ? toISODate(patch.date) : undefined,
      domain: patch.domain,
      link: patch.link,
      description: patch.desc,
      minutes: patch.time ? toMinutes(patch.time) : undefined,
    })
    await load()
  }

  async function deleteEntry(id: string) {
    await entriesApi.deleteEntry(id)
    await load()
  }

  return {
    days,
    weekLabel,
    weekTotal,
    weekCount,
    weekEntriesAll,
    isCurrentWeek,
    canGoNext,
    viewEmployeeId,
    setViewEmployee,
    prevWeek,
    nextWeek,
    load,
    addEntry,
    updateEntry,
    deleteEntry,
  }
})
