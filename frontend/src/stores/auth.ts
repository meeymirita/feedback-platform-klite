import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { authApi } from '@/api/auth'
import { ApiError } from '@/api/http'
import type { AuthUser, Credentials, UserRole } from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
  // null — гость. ready — завершён ли первый поход на /users/profile
  // (роутер-гарду, чтобы при F5 не мигать страницей входа).
  const user = ref<AuthUser | null>(null)
  const ready = ref(false)

  const isAuthenticated = computed(() => user.value !== null)
  const role = computed<UserRole | null>(() => user.value?.role ?? null)
  const isPrivileged = computed(() => role.value === 'ADMIN' || role.value === 'MIRA')

  // Дедуп: main.ts и роутер-гард могут дёрнуть fetchMe одновременно на старте.
  let inflight: Promise<void> | null = null

  // Проверка сессии по куке. 401 → гость, остальные ошибки пробрасываем.
  function fetchMe(): Promise<void> {
    if (inflight) return inflight
    inflight = (async () => {
      try {
        user.value = await authApi.me()
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          user.value = null
        } else {
          throw e
        }
      } finally {
        ready.value = true
      }
    })().finally(() => {
      inflight = null
    })
    return inflight
  }

  async function login(creds: Credentials): Promise<void> {
    const { user: u } = await authApi.login(creds)
    user.value = u
  }

  async function logout(): Promise<void> {
    try {
      await authApi.logout()
    } finally {
      // даже если запрос упал — на клиенте разлогиниваемся
      user.value = null
    }
  }

  // Зовётся из http.ts при любом 401 (например, сессия протухла между запросами).
  // Редирект не тут — его сделает роутер-гард при следующей навигации.
  function clearOnUnauthorized(): void {
    user.value = null
  }

  return {
    user,
    ready,
    isAuthenticated,
    role,
    isPrivileged,
    fetchMe,
    login,
    logout,
    clearOnUnauthorized,
  }
})
