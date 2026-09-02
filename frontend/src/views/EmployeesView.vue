<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import EmployeeModal from '@/components/employee/EmployeeModal.vue'
import { useEmployeesStore } from '@/stores/employees'
import { useNotificationsStore } from '@/stores/notifications'
import PasswordModal from '@/components/ui/PasswordModal.vue'
import type { Employee } from '@/types/employee'
import { createUser } from '@/api/users'

const store = useEmployeesStore()
const notify = useNotificationsStore()
const { employees } = storeToRefs(store)
const { updateEmployee, setPassword } = store

const showEmployeeModal = ref(false)
const editing = ref<Employee | null>(null)
const pwdFor = ref<Employee | null>(null)

function openCreate() {
  editing.value = null
  showEmployeeModal.value = true
}
function openEdit(emp: Employee) {
  editing.value = emp
  showEmployeeModal.value = true
}
async function onSubmit(data: {
  name: string
  email: string
  role: Employee['role']
  password: string
}) {
  if (editing.value) {
    updateEmployee(editing.value.id, { name: data.name, email: data.email, role: data.role })
    notify.success('Данные сотрудника обновлены')
    return
  }
  try {
    await createUser({
      displayName: data.name,
      email: data.email,
      password: data.password,
      role: data.role === 'Админ' ? 'ADMIN' : 'USER',
    })
    notify.success('Аккаунт создан. Передай пароль сотруднику.')
  } catch (e) {
    notify.error(e instanceof Error ? e.message : 'Не удалось создать аккаунт')
  }
}
function onPassword(password: string) {
  if (!pwdFor.value) return
  setPassword(pwdFor.value.id, password)
  notify.success(`Пароль обновлён — ${pwdFor.value.name}`)
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

        <div
          v-for="emp in employees"
          :key="emp.id"
          class="grid grid-cols-[1fr_230px_110px_130px_150px] items-center gap-3.5 border-t border-[#f1f2f5] px-4 py-3 hover:bg-[#fafbfc]"
        >
          <!-- ФИО -->
          <div class="flex min-w-0 items-center gap-2.5">
            <div
              class="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[#f8e8e6] text-[11px] font-semibold text-brand"
            >
              {{ emp.initials }}
            </div>
            <div class="truncate text-[13.5px] font-medium">
              {{ emp.name }}
            </div>
          </div>

          <div class="truncate font-mono text-[11.5px] text-[#6b7280]">{{ emp.email }}</div>
          <div class="text-[12.5px] text-[#3d434c]">{{ emp.role }}</div>
          <div
            class="font-mono text-xs"
            :class="emp.last === '—' ? 'text-[#9aa1ad]' : 'text-[#4b5563]'"
          >
            {{ emp.last }}
          </div>

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
    :employee="editing ?? undefined"
    @submit="onSubmit"
    @close="showEmployeeModal = false"
  />
  <PasswordModal v-if="pwdFor" :employee="pwdFor" @submit="onPassword" @close="pwdFor = null" />
</template>
