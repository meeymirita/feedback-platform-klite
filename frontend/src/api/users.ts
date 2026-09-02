import { api } from '@/api/http'
import type { AuthUser, UserRole } from '@/types/auth'

// Создать аккаунт сотрудника. Доступно только ADMIN / MIRA (проверяет бэкенд).
export function createUser(data: {
  displayName: string
  email: string
  password: string
  role: UserRole
}) {
  return api.post<AuthUser>('/users/create-user', data)
}
