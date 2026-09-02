import { defineStore } from 'pinia'
import { useToast } from 'vue-toastification'

// Единая точка для всех уведомлений приложения. Вью зовут notify.success(...) и т.п.,
// а не useToast() напрямую — так проще поменять реализацию и стиль в одном месте.
export type NotifyKind = 'success' | 'error' | 'info' | 'warning'

export const useNotificationsStore = defineStore('notifications', () => {
  const toast = useToast()

  function notify(kind: NotifyKind, message: string) {
    toast[kind](message)
  }
  const success = (message: string) => notify('success', message)
  const error = (message: string) => notify('error', message)
  const info = (message: string) => notify('info', message)
  const warning = (message: string) => notify('warning', message)

  return { notify, success, error, info, warning }
})
