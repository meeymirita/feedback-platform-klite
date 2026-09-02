import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { useReportEntriesStore } from '@/stores/reportEntries'
import { getSummary, type SummaryRow as ApiSummaryRow } from '@/api/reports'
import { fromMinutes } from '@/utils/time'

// 40 рабочих часов = полная загрузка (100% полоски)
const FULL_WEEK_MIN = 40 * 60

export interface SummaryRow {
  id: string
  initials: string
  name: string
  count: number
  total: string
  pct: number
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export const useSummaryStore = defineStore('summary', () => {
  const reportEntries = useReportEntriesStore()

  const raw = ref<ApiSummaryRow[]>([])

  async function load() {
    const { from, to } = reportEntries.weekRangeISO
    raw.value = await getSummary(from, to)
  }

  // при смене недели — перезагрузка
  watch(() => reportEntries.weekLabel, () => {
    void load()
  })

  const summary = computed<SummaryRow[]>(() =>
    raw.value.map((r) => ({
      id: r.userId,
      initials: initials(r.displayName),
      name: r.displayName,
      count: r.count,
      total: fromMinutes(r.minutes),
      pct: Math.min(100, Math.round((r.minutes / FULL_WEEK_MIN) * 100)),
    })),
  )

  const companyCount = computed(() => raw.value.reduce((s, r) => s + r.count, 0))
  const companyTotal = computed(() =>
    fromMinutes(raw.value.reduce((s, r) => s + r.minutes, 0)),
  )

  return { summary, companyCount, companyTotal, load }
})
