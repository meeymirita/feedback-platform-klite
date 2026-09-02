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

/* ═════════════════════════════════════════════════════════════════════════════
   ЗАДАЧА ВЕТКИ frontend/employee-modal   (заметка временная, удалить по готовности)

   Оживить EmployeeModal + PasswordModal по тому же приёму, что EntryModal:
   v-model + валидация (за флагом submitted) + сабмит → экшены стора employees.
   Модалки в стор не ходят — отдают payload наружу, add/update решает EmployeesView.

   Трогаем: types/employee.ts, stores/employees.ts,
   components/employee/EmployeeModal.vue, components/ui/PasswordModal.vue,
   views/EmployeesView.vue.

   ─────────────────────────────────────────────────────────────────────────────
   1. src/types/employee.ts — добавить идентификатор

   export interface Employee {
     id: string          // ← новый, по нему :key и поиск в сторе
     initials: string     // выводим из name, руками не вводим
     name: string
     email: string
     role: 'Сотрудник' | 'Админ'
     last: string
     active: boolean
   }

   ─────────────────────────────────────────────────────────────────────────────
   2. src/stores/employees.ts

   • В демо-данные добавить id: '1'…'5' каждой строке (initials там уже есть,
     оставить как есть — совпадают).
   • Локальный хелпер (не экспортировать):
       function initialsFrom(name: string): string {
         return name.trim().split(/\s+/).slice(0, 2)
           .map((w) => w[0]?.toUpperCase() ?? '').join('')
       }
   • Экшены:
       type NewEmployee = Pick<Employee, 'name' | 'email' | 'role'>

       function addEmployee(data: NewEmployee) {
         employees.value.push({
           id: crypto.randomUUID(),
           initials: initialsFrom(data.name),
           ...data,
           last: '—',
           active: true,
         })
       }
       function updateEmployee(id: string, patch: Partial<NewEmployee>) {
         const e = employees.value.find((x) => x.id === id)
         if (!e) return
         Object.assign(e, patch)
         if (patch.name) e.initials = initialsFrom(patch.name)
       }
       function setActive(id: string, active: boolean) {
         const e = employees.value.find((x) => x.id === id)
         if (e) e.active = active
       }
       function setPassword(id: string, password: string) {
         // демо без бэка — пароли нигде не хранятся; заглушка под будущий API
         console.info('setPassword (демо):', id, password.length + ' символов')
       }
   • return { employees, addEmployee, updateEmployee, setActive, setPassword }

   ─────────────────────────────────────────────────────────────────────────────
   3. src/components/employee/EmployeeModal.vue

   <script setup>:
     import { ref, reactive, computed } from 'vue'
     import type { Employee } from '@/types/employee'

     const props = defineProps<{ employee?: Employee }>()
     const emit = defineEmits<{
       close: []
       submit: [data: Pick<Employee, 'name' | 'email' | 'role'>]
     }>()

     const isEdit = !!props.employee
     const form = reactive({
       name:  props.employee?.name  ?? '',
       email: props.employee?.email ?? '',
       role:  props.employee?.role  ?? ('Сотрудник' as Employee['role']),
     })

     const submitted = ref(false)
     const errors = computed(() => ({
       name:  !form.name.trim(),
       email: !/^\S+@\S+\.\S+$/.test(form.email.trim()),
     }))
     const hasErrors = computed(() => Object.values(errors.value).some(Boolean))
     const showError = (k: keyof typeof errors.value) => submitted.value && errors.value[k]

     const tempPwd = ref(gen())
     function gen() { return Math.random().toString(36).slice(2, 12) }
     function copyPwd() { navigator.clipboard?.writeText(tempPwd.value) }

     function save() {
       if (hasErrors.value) { submitted.value = true; return }
       emit('submit', {
         name: form.name.trim(),
         email: form.email.trim(),
         role: form.role,
       })
       emit('close')
     }

     const invalid = '!border-[#c8442f]'

   <template> — по текущей вёрстке точечно:
     • Заголовок: "Новый сотрудник" -> {{ isEdit ? 'Изменить сотрудника' : 'Новый сотрудник' }}
     • ФИО:   <input v-model="form.name"  :class="[field, showError('name') && invalid]" ...>
     • Email:  <input v-model="form.email" :class="[field, showError('email') && invalid]"
               class="font-mono !text-[12.5px]" ...>
     • Роль:  <select v-model="form.role"><option>Сотрудник</option><option>Админ</option></select>
     • Блок «Временный пароль» — обернуть в <template v-if="!isEdit"> (при правке не показываем):
         текст пароля -> {{ tempPwd }}
         «Сгенерировать заново» -> @click="tempPwd = gen()"
         «Копировать» -> @click="copyPwd"
       (пароль тут только показывается; смену делает PasswordModal)
     • Кнопка submit: "Создать аккаунт" -> {{ isEdit ? 'Сохранить' : 'Создать аккаунт' }},
       @click="save"

   ─────────────────────────────────────────────────────────────────────────────
   4. src/components/ui/PasswordModal.vue   (сценарий: админ задаёт пароль сотруднику)

   <script setup>:
     import { ref, reactive, computed } from 'vue'
     import type { Employee } from '@/types/employee'

     const props = defineProps<{ employee: Employee }>()
     const emit = defineEmits<{ close: []; submit: [password: string] }>()

     const form = reactive({ next: '', repeat: '' })
     const submitted = ref(false)
     const errors = computed(() => ({
       next:   form.next.length < 8,
       repeat: !form.repeat || form.repeat !== form.next,
     }))
     const hasErrors = computed(() => Object.values(errors.value).some(Boolean))
     const showError = (k: keyof typeof errors.value) => submitted.value && errors.value[k]

     function save() {
       if (hasErrors.value) { submitted.value = true; return }
       emit('submit', form.next)
       emit('close')
     }
     const invalid = '!border-[#c8442f]'

   <template>:
     • Заголовок: "Смена пароля" -> "Смена пароля — {{ props.employee.name }}"
     • Поле «Текущий пароль» — УБРАТЬ (админ его не знает; самосмена своего пароля —
       отдельная ветка, нужен auth-стор).
     • «Новый пароль»:      <input type="password" v-model="form.next"
                            :class="[field, showError('next') && invalid]">
     • «Повторите новый пароль»: <input type="password" v-model="form.repeat"
                            :class="[field, showError('repeat') && invalid]">
     • Кнопка «Сменить пароль» -> @click="save"

   ─────────────────────────────────────────────────────────────────────────────
   5. src/views/EmployeesView.vue

   <script setup>:
     import PasswordModal from '@/components/ui/PasswordModal.vue'
     import type { Employee } from '@/types/employee'

     const store = useEmployeesStore()
     const { employees } = storeToRefs(store)
     const { addEmployee, updateEmployee, setActive, setPassword } = store

     const showEmployeeModal = ref(false)
     const editing = ref<Employee | null>(null)
     const pwdFor  = ref<Employee | null>(null)

     function openCreate() { editing.value = null; showEmployeeModal.value = true }
     function openEdit(emp: Employee) { editing.value = emp; showEmployeeModal.value = true }
     function onSubmit(data: Pick<Employee, 'name' | 'email' | 'role'>) {
       if (editing.value) updateEmployee(editing.value.id, data)
       else addEmployee(data)
     }
     function toggleActive(emp: Employee) {
       if (emp.active && !confirm(`Заблокировать ${emp.name}?`)) return
       setActive(emp.id, !emp.active)
     }
     function onPassword(password: string) {
       if (pwdFor.value) setPassword(pwdFor.value.id, password)
     }

   <template>:
     • «＋ Добавить сотрудника»: @click="showEmployeeModal = true" -> @click="openCreate"
     • строки: :key="emp.email" -> :key="emp.id"
     • ячейка «Действия» (сейчас 2 кнопки) — добавить 3-ю «Пароль»; кнопкам дать
       flex-wrap (или уменьшить gap-3 -> gap-2), колонка узкая:
         «Изменить»       -> @click="openEdit(emp)"
         «Пароль»          -> @click="pwdFor = emp"     (новая кнопка, стиль как «Изменить»)
         «Заблокировать/Разблокировать» -> @click="toggleActive(emp)"
     • внизу, вместо одиночного EmployeeModal:
         <EmployeeModal
           v-if="showEmployeeModal"
           :employee="editing ?? undefined"
           @submit="onSubmit"
           @close="showEmployeeModal = false"
         />
         <PasswordModal
           v-if="pwdFor"
           :employee="pwdFor"
           @submit="onPassword"
           @close="pwdFor = null"
         />

   ─────────────────────────────────────────────────────────────────────────────
   НЕ ТРОГАЕМ в этой ветке
     • «войти как …» (имперсонация) — нужен auth-стор, отдельная ветка.
     • Самостоятельная смена своего пароля (с «текущим паролем») — тоже с auth.
     • Реальная генерация/хранение/отправка пароля, уникальность email, коллизии —
       вместе с API-слоем и бэком.
     • «Последняя запись» (last) — считается по записям сотрудника, появится с бэком.

   ПРОВЕРКА
     npm run type-check && npm run lint && npm run build
     npm run dev, экран «Сотрудники»:
       — «Добавить сотрудника» → ФИО/email/роль → «Создать аккаунт»: строка
         появилась, инициалы вычислены из ФИО, статус «Активен», last «—»;
       — «Изменить»: поля предзаполнены, блок пароля скрыт, после «Сохранить»
         изменения видны (инициалы пересчитались при смене ФИО);
       — «Заблокировать» → подтверждение → строка тускнеет, статус «Заблокирован»,
         кнопка стала «Разблокировать» и обратно;
       — «Пароль» → ввод < 8 символов или несовпадение → красные рамки после
         «Сменить пароль»; валидные → модалка закрывается (в консоли лог-заглушка);
       — «Сохранить»/«Создать»/«Сменить» неактивны по сути (сабмит не проходит),
         пока есть ошибки.

   ПОСЛЕ ГОТОВНОСТИ
     • docs/CHECKLIST.md: пункт «Модалки … EmployeeModal / PasswordModal» —
       из [~] в [x] (или отдельным [x]).
     • Удалить эту заметку из router/index.ts.
═════════════════════════════════════════════════════════════════════════════ */
