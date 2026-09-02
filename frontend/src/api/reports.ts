import { api } from '@/api/http'
import type { ApiEntry } from '@/api/reportEntries'

// Строка сводки: сколько записей и минут у сотрудника за период.
export interface SummaryRow {
  userId: string
  displayName: string
  count: number
  minutes: number
}

// Сводка по всем сотрудникам за неделю. Только ADMIN / MIRA.
export function getSummary(from: string, to: string) {
  return api.get<SummaryRow[]>(`/reports/summary?from=${from}&to=${to}`)
}

// Записи конкретного сотрудника за период (drill-down из сводного).
export function getUserEntries(userId: string, from: string, to: string) {
  return api.get<ApiEntry[]>(`/reports/entries?userId=${userId}&from=${from}&to=${to}`)
}
