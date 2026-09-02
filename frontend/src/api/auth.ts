// Тонкие обёртки над api — по одной функции на эндпоинт /auth/* и /users/profile.
// Никакой логики: состояние держит stores/auth.ts.
import { api } from './http'
import type { AuthUser, Credentials } from '@/types/auth'

// login/register возвращают { user }, profile — сам объект пользователя.
export const authApi = {
  login: (creds: Credentials) => api.post<{ user: AuthUser }>('/auth/login', creds),
  logout: () => api.post<void>('/auth/logout'),
  me: () => api.get<AuthUser>('/users/profile'),
}
