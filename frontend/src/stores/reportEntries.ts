import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import type { ReportEntry, ReportDay } from '@/types/report'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'
import * as entriesApi from '@/api/reportEntries'
import * as reportsApi from '@/api/reports'
import { toMinutes, fromMinutes } from '@/utils/time'
import {
  weekdayName,
  parseDmy,
  addDays,
  mondayOf,
  weekRangeLabel,
  isoLocal,
  toISODate,
  fromISODate,
} from '@/utils/date'

// Раньше это был id демо-сотрудника. Оставлен, чтобы EntriesView не переписывать —
// бэкенд всё равно берёт автора записи из сессии.
export const MY_EMPLOYEE_ID = ''

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

  // Записи выбранной недели (мои или, при drill-down, чужие).
  const rows = ref<ReportEntry[]>([])

  const weekOffset = ref(0) // 0 — неделя с «сегодня», −1 предыдущая, …
  const weekStart = computed(() => addDays(mondayOf(new Date()), weekOffset.value * 7))
  const isCurrentWeek = computed(() => weekOffset.value === 0)
  const canGoNext = computed(() => weekOffset.value < 0) // вперёд текущей не пускаем
  const weekLabel = computed(() => weekRangeLabel(weekStart.value))

  // Период выбранной недели в ISO, Пн..Пт включительно (рабочая неделя).
  const weekRangeISO = computed(() => ({
    from: isoLocal(weekStart.value),
    to: isoLocal(addDays(weekStart.value, 4)),
  }))

  // Чей отчёт смотрим: свой id — мои записи; чужой id — drill-down из сводного
  // (только ADMIN/MIRA). Инициализируем сразу собой.
  const viewEmployeeId = ref(auth.user?.id ?? '')
  function setViewEmployee(id?: string) {
    viewEmployeeId.value = id || auth.user?.id || ''
  }

  // Загрузка записей выбранной недели. Ошибку показываем тостом (вызывается
  // из вотчера, вьюхе её не поймать).
  async function load() {
    try {
      const { from, to } = weekRangeISO.value
      const uid = viewEmployeeId.value
      const mine = !uid || uid === auth.user?.id
      const list = mine
        ? await entriesApi.listEntries(from, to)
        : await reportsApi.getUserEntries(uid, from, to)
      rows.value = list.map(toRow)
    } catch (e) {
      useNotificationsStore().error(
        e instanceof Error ? e.message : 'Не удалось загрузить записи',
      )
    }
  }

  // Единственный триггер перезагрузки: смена недели или просматриваемого
  // сотрудника. immediate — грузим сразу при создании стора.
  watch([weekStart, viewEmployeeId], () => void load(), { immediate: true })

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
    weekRangeISO,
    weekTotal,
    weekCount,
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
