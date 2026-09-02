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
