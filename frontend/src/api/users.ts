import { api } from '@/api/http'
import type { AuthUser, UserRole } from '@/types/auth'

// Всё ниже доступно только ADMIN / MIRA — проверяет бэкенд.

// Создать аккаунт сотрудника.
export function createUser(data: {
  displayName: string
  email: string
  password: string
  role: UserRole
}) {
  return api.post<AuthUser>('/users/create-user', data)
}

// Список сотрудников (без MIRA — бэкенд его не отдаёт).
export function listUsers() {
  return api.get<AuthUser[]>('/users')
}

// Правка имени и/или роли. Email не меняем.
export function updateUser(id: string, data: { displayName?: string; role?: UserRole }) {
  return api.patch<AuthUser>(`/users/${id}`, data)
}

// Сброс пароля сотруднику.
export function resetPassword(id: string, password: string) {
  return api.patch<void>(`/users/${id}/password`, { password })
}
