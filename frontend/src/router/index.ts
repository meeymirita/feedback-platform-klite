import { createRouter, createWebHistory } from 'vue-router'

// TODO (другие ветки, не сейчас):
//  - auth: beforeEach-гард, meta.requiresAuth + meta.roles: ['admin'] на /employees и /summary,
//    редирект гостей на /login, залогиненных с '/' в /entries
//  - drill-down: /employees/:id/weekly (просмотр чужого отчёта из сводного, ТЗ 3.3)
//  - инфра: fallback на index.html в Caddy для createWebHistory (иначе прямой заход по /entries → 404)

// Пункты бокового меню берутся из самих маршрутов:
// meta.nav === true → маршрут показывается в сайдбаре, meta.label — его подпись.
// Порядок пунктов = порядок маршрутов ниже.
declare module 'vue-router' {
  interface RouteMeta {
    nav?: boolean
    label?: string
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    {
      path: '/', // Страница входа
      name: 'login',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/',
      component: () => import('@/components/layout/DefaultLayout.vue'),
      children: [
        {
          path: 'entries',
          name: 'entries',
          component: () => import('@/views/EntriesView.vue'),
          meta: { nav: true, label: 'Мои записи'},
        },
        {
          path: 'weekly',
          name: 'weekly',
          component: () => import('@/views/WeeklyReportView.vue'),
          meta: { nav: true, label: 'Недельный отчёт'},
        },
        {
          path: 'employees',
          name: 'employees',
          component: () => import('@/views/EmployeesView.vue'),
          meta: { nav: true, label: 'Сотрудники'},
        },
        {
          path: 'summary',
          name: 'summary',
          component: () => import('@/views/SummaryView.vue'),
          meta: { nav: true, label: 'Сводный отчёт'},
        },
      ],
    },
    {
      // 404 — на весь экран, без каркаса кабинета. Ловит всё, что не совпало выше.
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { nav: false, label: 'Неизвестная страница'},
    },
  ],
})
router.afterEach((to) => {
  document.title = to.meta.label ? `${to.meta.label}` : 'k - report'
})
export default router

/* ─────────────────────────────────────────────────────────────────────────────
   ЗАДАЧА ВЕТКИ frontend/notfound-tweaks  (заметка временная, удалить по готовности)

   Цель: добавить анимированную тучку с дождём на 404 — маленькая, у логотипа
   в левой колонке (сделано в Claude Design, макет 404.dc.html). Только вёрстка,
   правит один файл: src/views/NotFoundView.vue.

   ── 1. Контейнер логотипа — сделать относительным ──────────────────────────
   Блок с лого + «Отчётность»:  class="flex items-center gap-2.5"  →  добавить
   `relative` (тучка позиционируется абсолютом внутри него).

   ── 2. Разметка тучки (первым ребёнком в блоке лого, перед <img>) ──────────
   <!-- Тучка над логотипом -->
   <div class="cloud absolute left-[-3px] top-[-34px] h-6 w-12">
     <div class="absolute left-1.5 top-2 h-[13px] w-10 rounded-lg bg-[#8d949e]"></div>
     <div class="absolute left-2.5 top-px h-4 w-4 rounded-full bg-[#8d949e]"></div>
     <div class="absolute left-[22px] top-[3px] h-[13px] w-[13px] rounded-full bg-[#9ba2ab]"></div>
     <span class="drop absolute left-[15px] top-5 h-2 w-0.5 rounded-[1px] bg-[#8d949e]"></span>
     <span class="drop drop-2 absolute left-[26px] top-5 h-2 w-0.5 rounded-[1px] bg-[#8d949e]"></span>
     <span class="drop drop-3 absolute left-9 top-5 h-2 w-0.5 rounded-[1px] bg-brand opacity-70"></span>
   </div>

   ── 3. В <style scoped> (там же, где .flicker / .shape) ────────────────────
   @keyframes cloudBob { 0%, 100% { transform: translateX(-1px) } 50% { transform: translateX(3px) } }
   @keyframes drop {
     0%   { opacity: 0;   transform: translateY(0) scaleY(.6) }
     20%  { opacity: .8 }
     100% { opacity: 0;   transform: translateY(26px) scaleY(1.2) }
   }
   .cloud  { animation: cloudBob 5s ease-in-out infinite }
   .drop   { animation: drop 1.4s linear infinite }
   .drop-2 { animation-duration: 1.6s; animation-delay: .5s }
   .drop-3 { animation-duration: 1.5s; animation-delay: .9s }

   Примечания:
   • Цвета серые из макета захардкожены (#8d949e / #9ba2ab), акцентная капля — bg-brand.
   • prefers-reduced-motion уже не обрабатывается в этом файле (flicker/shape тоже без него) — не усложняем.

   ── НЕ В ЭТОЙ ВЕТКЕ ────────────────────────────────────────────────────────
   Остальные отличия макета от текущей вьюхи (дождь-оверлей на правой колонке,
   «дышащая» иллюстрация, рука с искрой и дымком, водяной знак «К», замена
   404.webp на anime-404-*.png) — отдельно, если решим тянуть весь редизайн.

   ── ПРОВЕРКА ───────────────────────────────────────────────────────────────
   npm run type-check && npm run lint && npm run build
   npm run dev → любой несуществующий путь: тучка над логотипом качается,
   три капли падают вразнобой, одна — брендовая.

   ── ПОСЛЕ ГОТОВНОСТИ ───────────────────────────────────────────────────────
   • Удалить эту заметку.
───────────────────────────────────────────────────────────────────────────── */
