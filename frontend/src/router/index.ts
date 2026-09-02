import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { UserRole } from '@/types/auth'

// Пункты бокового меню берутся из самих маршрутов:
// meta.nav === true → маршрут показывается в сайдбаре, meta.label — его подпись.
// Порядок пунктов = порядок маршрутов ниже.
declare module 'vue-router' {
  interface RouteMeta {
    nav?: boolean
    label?: string
    requiresAuth?: boolean // маршрут только для залогиненных
    guestOnly?: boolean // маршрут только для гостей (страница входа)
    roles?: UserRole[] // если задано — доступ только этим ролям
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
      meta: { guestOnly: true },
    },
    {
      path: '/',
      component: () => import('@/components/layout/DefaultLayout.vue'),
      meta: { requiresAuth: true }, // наследуется всеми детьми (см. to.matched в гарде)
      children: [
        {
          path: 'entries',
          name: 'entries',
          component: () => import('@/views/EntriesView.vue'),
          meta: { nav: true, label: 'Мои записи' },
        },
        {
          path: 'weekly',
          name: 'weekly',
          component: () => import('@/views/WeeklyReportView.vue'),
          meta: { nav: true, label: 'Недельный отчёт' },
        },
        {
          path: 'employees',
          name: 'employees',
          component: () => import('@/views/EmployeesView.vue'),
          meta: { nav: true, label: 'Сотрудники', roles: ['ADMIN', 'MIRA'] },
        },
        {
          path: 'summary',
          name: 'summary',
          component: () => import('@/views/SummaryView.vue'),
          meta: { nav: true, label: 'Сводный отчёт', roles: ['ADMIN', 'MIRA'] },
        },
        {
          // drill-down из сводного отчёта: недельный отчёт конкретного сотрудника
          path: 'employees/:id/weekly',
          name: 'employee-weekly',
          component: () => import('@/views/WeeklyReportView.vue'),
          meta: { nav: false, label: 'Отчёт сотрудника', roles: ['ADMIN', 'MIRA'] },
        },
      ],
    },
    {
      // 404 — на весь экран, без каркаса кабинета. Ловит всё, что не совпало выше.
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { nav: false, label: 'Неизвестная страница' },
    },
  ],
})

// Единый гард. async — при прямом заходе по URL (F5) стор ещё пуст,
// надо один раз сходить на /users/profile (fetchMe дедуплит сам себя).
router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!auth.ready) await auth.fetchMe()

  const needsAuth = to.matched.some((r) => r.meta.requiresAuth)

  // гость лезет в кабинет → на вход, запоминаем куда шёл
  if (needsAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  // залогиненный открыл страницу входа → в кабинет
  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'entries' }
  }
  // роль не подходит → в свою стартовую
  if (to.meta.roles && (!auth.role || !to.meta.roles.includes(auth.role))) {
    return { name: 'entries' }
  }
  return true
})

router.afterEach((to) => {
  document.title = to.meta.label ? `${to.meta.label}` : 'k - report'
})

export default router
