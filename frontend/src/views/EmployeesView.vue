<script setup lang="ts">
import { ref } from 'vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import EmployeeModal from '@/components/employee/EmployeeModal.vue'

// Демо-данные. `active: false` — заблокированный сотрудник.
const employees = [
  {
    initials: 'СА',
    name: 'Соколов Артём Игоревич',
    email: 'a.sokolov@kontur-group.ru',
    role: 'Сотрудник',
    last: '31.08.2026',
    active: true,
  },
  {
    initials: 'МД',
    name: 'Мельникова Дарья Сергеевна',
    email: 'd.melnikova@kontur-group.ru',
    role: 'Сотрудник',
    last: '31.08.2026',
    active: true,
  },
  {
    initials: 'ГН',
    name: 'Гаврилов Никита Павлович',
    email: 'n.gavrilov@kontur-group.ru',
    role: 'Сотрудник',
    last: '28.08.2026',
    active: false,
  },
  {
    initials: 'ТО',
    name: 'Ткачук Ольга Владимировна',
    email: 'o.tkachuk@kontur-group.ru',
    role: 'Админ',
    last: '31.08.2026',
    active: true,
  },
  {
    initials: 'ЕП',
    name: 'Ерёмин Павел Андреевич',
    email: 'p.eremin@kontur-group.ru',
    role: 'Сотрудник',
    last: '—',
    active: true,
  },
]

const showEmployeeModal = ref(false)
</script>

<template>
  <div class="flex min-h-screen bg-[#f5f6f8] font-sans text-ink">
    <AppSidebar active="employees" />

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
            @click="showEmployeeModal = true"
          >
            ＋ Добавить сотрудника
          </button>
        </div>

        <!-- Таблица -->
        <div class="overflow-hidden rounded-[9px] border border-[#e6e8ed] bg-white">
          <div
            class="grid grid-cols-[1fr_230px_110px_130px_120px_150px] gap-3.5 border-b border-[#e6e8ed] bg-[#fafbfc] px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.06em] text-[#6b7280]"
          >
            <div>ФИО</div>
            <div>Email</div>
            <div>Роль</div>
            <div>Последняя запись</div>
            <div>Статус</div>
            <div class="text-right">Действия</div>
          </div>

          <div
            v-for="emp in employees"
            :key="emp.email"
            class="grid grid-cols-[1fr_230px_110px_130px_120px_150px] items-center gap-3.5 border-t border-[#f1f2f5] px-4 py-3 hover:bg-[#fafbfc]"
            :class="{ 'bg-[#fbfbfc]': !emp.active }"
          >
            <!-- ФИО -->
            <div class="flex min-w-0 items-center gap-2.5">
              <div
                class="flex h-7 w-7 flex-none items-center justify-center rounded-full text-[11px] font-semibold"
                :class="
                  emp.active
                    ? 'bg-[#f8e8e6] text-brand'
                    : 'bg-[#f1f2f5] text-[#9aa1ad]'
                "
              >
                {{ emp.initials }}
              </div>
              <div
                class="truncate text-[13.5px] font-medium"
                :class="{ 'text-[#9aa1ad]': !emp.active }"
              >
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

            <!-- Статус -->
            <div class="flex items-center gap-1.5 text-[12.5px]">
              <span
                class="h-1.5 w-1.5 rounded-full"
                :class="emp.active ? 'bg-[#1f9d55]' : 'bg-[#a8adb6]'"
              ></span>
              <span :class="emp.active ? 'text-[#1f7a4d]' : 'text-[#7a7f88]'">
                {{ emp.active ? 'Активен' : 'Заблокирован' }}
              </span>
            </div>

            <!-- Действия -->
            <div class="flex justify-end gap-3">
              <button class="text-[12.5px] text-[#6b7280] hover:text-brand">Изменить</button>
              <button class="text-[12.5px] text-[#9aa1ad] hover:text-[#c8442f]">
                {{ emp.active ? 'Заблокировать' : 'Разблокировать' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <EmployeeModal v-if="showEmployeeModal" @close="showEmployeeModal = false" />
  </div>
</template>
