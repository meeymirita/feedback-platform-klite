import { api } from '@/api/http'

// Запись как её отдаёт бэкенд: дата ISO, время в минутах, поле description.
export interface ApiEntry {
  id: string
  userId: string
  date: string
  domain: string
  link: string
  description: string
  minutes: number
}

// Тело для create/update. У update все поля необязательные.
export interface EntryPayload {
  date: string
  domain: string
  link: string
  description: string
  minutes: number
}

// Свои записи за период (обе даты включительно), YYYY-MM-DD.
export function listEntries(from: string, to: string) {
  return api.get<ApiEntry[]>(`/report-entries?from=${from}&to=${to}`)
}

export function createEntry(data: EntryPayload) {
  return api.post<ApiEntry>('/report-entries', data)
}

export function updateEntry(id: string, data: Partial<EntryPayload>) {
  return api.patch<ApiEntry>(`/report-entries/${id}`, data)
}

export function deleteEntry(id: string) {
  return api.delete<void>(`/report-entries/${id}`)
}
