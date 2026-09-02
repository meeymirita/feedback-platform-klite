import './assets/main.css'
import 'vue-toastification/dist/index.css'
import './assets/toast.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Toast, { POSITION, type PluginOptions } from 'vue-toastification'

import App from './App.vue'
import router from './router'
import { setUnauthorizedHandler } from './api/http'
import { useAuthStore } from './stores/auth'

const app = createApp(App)

app.use(createPinia())
app.use(router)

const toastOptions: PluginOptions = {
  position: POSITION.BOTTOM_RIGHT,
  timeout: 3200,
  maxToasts: 4,
  newestOnTop: true,
  icon: false,
  closeButton: 'button',
  hideProgressBar: false,
  pauseOnHover: true,
  closeOnClick: true,
  draggable: true,
}
app.use(Toast, toastOptions)

// 401 из любого запроса → сбрасываем пользователя; редирект сделает роутер-гард
// при следующей навигации.
setUnauthorizedHandler(() => {
  useAuthStore().clearOnUnauthorized()
})

// Проверяем сессию по куке ДО первого рендера — иначе мигнёт страница входа.
async function bootstrap() {
  await useAuthStore().fetchMe()
  await router.isReady()
  app.mount('#app')
}
void bootstrap()
