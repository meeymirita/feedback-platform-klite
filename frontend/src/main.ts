import './assets/main.css'
import 'vue-toastification/dist/index.css'
import './assets/toast.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Toast, { POSITION, type PluginOptions } from 'vue-toastification'

import App from './App.vue'
import router from './router'

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

app.mount('#app')
