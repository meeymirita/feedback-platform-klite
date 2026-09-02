// Единственная точка выхода в бэкенд. Сторы и компоненты не зовут fetch напрямую —
// импортят { api }. Здесь в одном месте: префикс /api/v1, отправка сессионной куки,
// сериализация JSON, разбор ответа и ошибок, реакция на 401.

const BASE = '/api/v1'

// Ошибка от API в типизированном виде: во view показываем e.message,
// по e.status решаем логику (401 → на вход, 409 → «уже существует» и т.п.).
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Колбэк на 401 (нет/протухла сессия). Регистрируется в main.ts, чтобы http.ts
// не зависел от стора и роутера напрямую (иначе циклы импортов).
let onUnauthorized: (() => void) | null = null
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(BASE + path, {
    method,
    credentials: 'include', // без этого кука сессии не уходит и не ставится
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const text = await res.text() // logout отдаёт пустое тело
  const data: unknown = text ? JSON.parse(text) : undefined

  if (!res.ok) {
    if (res.status === 401) onUnauthorized?.()
    // NestJS-исключение: { message: string | string[], error, statusCode }
    const raw = (data as { message?: unknown } | undefined)?.message
    const message = Array.isArray(raw)
      ? raw.join('. ')
      : typeof raw === 'string'
        ? raw
        : `Ошибка запроса (${res.status})`
    throw new ApiError(res.status, message)
  }

  return data as T
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
}
