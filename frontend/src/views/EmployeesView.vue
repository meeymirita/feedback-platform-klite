<script setup lang="ts">
import { ref, onMounted } from 'vue'
import EmployeeModal from '@/components/employee/EmployeeModal.vue'
import PasswordModal from '@/components/ui/PasswordModal.vue'
import { useNotificationsStore } from '@/stores/notifications'
import { listUsers, createUser, updateUser, resetPassword } from '@/api/users'
import { initials } from '@/utils/initials'
import type { AuthUser, UserRole } from '@/types/auth'

const notify = useNotificationsStore()

// Реальные сотрудники с бэкенда (GET /users, без MIRA).
const rows = ref<AuthUser[]>([])

async function load() {
  try {
    rows.value = await listUsers()
  } catch (e) {
    notify.error(e instanceof Error ? e.message : 'Не удалось загрузить список')
  }
}
onMounted(load)

// Роль: бэкенд говорит USER/ADMIN, в интерфейсе — Сотрудник/Админ.
type RoleLabel = 'Сотрудник' | 'Админ'
const roleRu = (r: UserRole): RoleLabel => (r === 'ADMIN' ? 'Админ' : 'Сотрудник')
const roleEn = (label: RoleLabel): UserRole => (label === 'Админ' ? 'ADMIN' : 'USER')

const showEmployeeModal = ref(false)
const editing = ref<AuthUser | null>(null)
const pwdFor = ref<AuthUser | null>(null)

function openCreate() {
  editing.value = null
  showEmployeeModal.value = true
}
function openEdit(emp: AuthUser) {
  editing.value = emp
  showEmployeeModal.value = true
}

async function onSubmit(data: { name: string; email: string; role: RoleLabel; password: string }) {
  try {
    if (editing.value) {
      // правка — email и пароль не трогаем
      await updateUser(editing.value.id, { displayName: data.name, role: roleEn(data.role) })
      notify.success('Данные сотрудника обновлены')
    } else {
      await createUser({
        displayName: data.name,
        email: data.email,
        password: data.password,
        role: roleEn(data.role),
      })
      notify.success('Аккаунт создан. Передай пароль сотруднику.')
    }
    await load()
  } catch (e) {
    notify.error(e instanceof Error ? e.message : 'Не удалось сохранить')
  }
}

async function onPassword(password: string) {
  if (!pwdFor.value) return
  // модалка закрывается синхронно после submit → pwdFor обнулится, запоминаем заранее
  const { id, displayName } = pwdFor.value
  try {
    await resetPassword(id, password)
    notify.success(`Пароль обновлён — ${displayName}`)
  } catch (e) {
    notify.error(e instanceof Error ? e.message : 'Не удалось сменить пароль')
  }
}
</script>

<template>
  <main class="min-w-0 flex-1 px-8 py-7">
    <div class="mx-auto flex max-w-[1080px] flex-col gap-5">
      <!-- Заголовок -->
      <div class="flex flex-wrap items-end justify-between gap-6">
        <div class="flex flex-col gap-1.5">
          <h1 class="text-[21px] font-semibold tracking-[-0.01em]">Сотрудники</h1>
          <p class="text-[13px] text-[#6b7280]">
            Аккаунты создаёт администратор. Самостоятельной регистрации нет.
          </p>
        </div>
        <button
          class="h-[38px] rounded-lg bg-brand px-4 text-[13.5px] font-medium text-white hover:bg-brand-hover"
          @click="openCreate"
        >
          ＋ Добавить сотрудника
        </button>
      </div>

      <!-- Таблица -->
      <div class="overflow-hidden rounded-[9px] border border-[#e6e8ed] bg-white">
        <div
          class="grid grid-cols-[1fr_230px_110px_130px_150px] gap-3.5 border-b border-[#e6e8ed] bg-[#fafbfc] px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.06em] text-[#6b7280]"
        >
          <div>ФИО</div>
          <div>Email</div>
          <div>Роль</div>
          <div>Последняя запись</div>
          <div class="text-right">Действия</div>
        </div>

        <div v-if="rows.length === 0" class="px-4 py-8 text-center text-[13px] text-[#9aa1ad]">
          Сотрудников пока нет
        </div>

        <div
          v-for="emp in rows"
          :key="emp.id"
          class="grid grid-cols-[1fr_230px_110px_130px_150px] items-center gap-3.5 border-t border-[#f1f2f5] px-4 py-3 hover:bg-[#fafbfc]"
        >
          <!-- ФИО -->
          <div class="flex min-w-0 items-center gap-2.5">
            <div
              class="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[#f8e8e6] text-[11px] font-semibold text-brand"
            >
              {{ initials(emp.displayName) }}
            </div>
            <div class="truncate text-[13.5px] font-medium">
              {{ emp.displayName }}
            </div>
          </div>

          <div class="truncate font-mono text-[11.5px] text-[#6b7280]">{{ emp.email }}</div>
          <div class="text-[12.5px] text-[#3d434c]">{{ roleRu(emp.role) }}</div>
          <div class="font-mono text-xs text-[#9aa1ad]">—</div>

          <!-- Действия -->
          <div class="flex justify-end gap-3">
            <button @click="openEdit(emp)" class="text-[12.5px] text-[#6b7280] hover:text-brand">
              Изменить
            </button>
            <button @click="pwdFor = emp" class="text-[12.5px] text-[#6b7280] hover:text-brand">
              Пароль
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>

  <EmployeeModal
    v-if="showEmployeeModal"
    :employee="
      editing
        ? { name: editing.displayName, email: editing.email, role: roleRu(editing.role) }
        : undefined
    "
    @submit="onSubmit"
    @close="showEmployeeModal = false"
  />
  <PasswordModal
    v-if="pwdFor"
    :name="pwdFor.displayName"
    @submit="onPassword"
    @close="pwdFor = null"
  />
</template>
