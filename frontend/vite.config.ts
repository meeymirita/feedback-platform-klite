import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Dev-сервер сам проксирует /api на бэкенд → для браузера всё на одном origin,
  // CORS не при делах, сессионная кука ходит как first-party. В проде тот же
  // /api/* проксирует Caddy, поэтому код фронта одинаков.
  // Префикс /api НЕ срезаем — бэк отдаёт полный путь /api/v1/... (setGlobalPrefix).
  // VITE_PROXY_TARGET: dev-контейнер → http://backend:3000 (см. docker-compose.dev.yml),
  // запуск на хосте → дефолт http://localhost:3000.
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
