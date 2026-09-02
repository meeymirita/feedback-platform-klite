import { computed } from 'vue'
import { defineStore } from 'pinia'
import { useReportEntriesStore } from '@/stores/reportEntries'
import { useEmployeesStore } from '@/stores/employees'
import { toMinutes, fromMinutes } from '@/utils/time'

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

export const useSummaryStore = defineStore('summary', () => {
  const reportEntries = useReportEntriesStore()
  const employees = useEmployeesStore()

  // строка на каждого сотрудника по записям выбранной недели
  const summary = computed<SummaryRow[]>(() =>
    employees.employees.map((emp) => {
      const mine = reportEntries.weekEntriesAll.filter((e) => e.employeeId === emp.id)
      const min = mine.reduce((s, e) => s + toMinutes(e.time), 0)
      return {
        id: emp.id,
        initials: emp.initials,
        name: emp.name,
        count: mine.length,
        total: fromMinutes(min),
        pct: Math.min(100, Math.round((min / FULL_WEEK_MIN) * 100)),
      }
    }),
  )

  const companyCount = computed(() => reportEntries.weekEntriesAll.length)
  const companyTotal = computed(() =>
    fromMinutes(reportEntries.weekEntriesAll.reduce((s, e) => s + toMinutes(e.time), 0)),
  )

  return { summary, companyCount, companyTotal }
})
