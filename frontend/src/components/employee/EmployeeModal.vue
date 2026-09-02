<script setup lang="ts">
// Модалка сотрудника: создание / правка.
import { ref, reactive, computed } from 'vue'
import type { Employee } from '@/types/employee'

const field =
  'h-[38px] rounded-lg border border-line px-3 text-sm outline-none focus:border-brand'

const props = defineProps<{ employee?: Employee }>()
const emit = defineEmits<{
  close: []
  submit: [data: Pick<Employee, 'name' | 'email' | 'role'>]
}>()

const isEdit = !!props.employee
const form = reactive({
  name: props.employee?.name ?? '',
  email: props.employee?.email ?? '',
  role: props.employee?.role ?? ('Сотрудник' as Employee['role']),
})

const submitted = ref(false)
const errors = computed(() => ({
  name: !form.name.trim(),
  email: !/^\S+@\S+\.\S+$/.test(form.email.trim()),
}))
const hasErrors = computed(() => Object.values(errors.value).some(Boolean))
const showError = (k: keyof typeof errors.value) => submitted.value && errors.value[k]

const tempPwd = ref(gen())
function gen() {
  return Math.random().toString(36).slice(2, 12)
}
function copyPwd() {
  navigator.clipboard?.writeText(tempPwd.value)
}

function save() {
  if (hasErrors.value) {
    submitted.value = true
    return
  }
  emit('submit', {
    name: form.name.trim(),
    email: form.email.trim(),
    role: form.role,
  })
  emit('close')
}

const invalid = '!border-[#c8442f]'
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/40 p-16 font-sans"
    @click.self="$emit('close')"
  >
    <div class="w-full max-w-[460px] overflow-hidden rounded-xl bg-white shadow-2xl">
      <div class="flex items-center justify-between border-b border-[#eceef2] px-5 py-4">
        <div>
          <div class="text-base font-semibold">
            {{ isEdit ? 'Изменить сотрудника' : 'Новый сотрудник' }}
          </div>
          <div class="text-xs text-[#6b7280]">Аккаунт создаёт администратор вручную</div>
        </div>
        <button
          class="flex h-7 w-7 items-center justify-center rounded-md bg-[#f4f5f7] text-[#6b7280] hover:bg-[#eceef2]"
          @click="$emit('close')"
        >
          ✕
        </button>
      </div>

      <div class="flex flex-col gap-3.5 px-5 py-5">
        <label class="flex flex-col gap-1.5">
          <span class="text-xs font-medium text-[#4b5563]">ФИО</span>
          <input
            v-model="form.name"
            :class="[field, showError('name') && invalid]"
            placeholder="Соколов Артём Игоревич"
          />
        </label>

        <div class="grid grid-cols-[1fr_150px] gap-3.5">
          <label class="flex flex-col gap-1.5">
            <span class="text-xs font-medium text-[#4b5563]">Email (логин)</span>
            <input
              v-model="form.email"
              :class="[field, showError('email') && invalid]"
              class="font-mono !text-[12.5px]"
              placeholder="name@kontur-group.ru"
            />
          </label>
          <label class="flex flex-col gap-1.5">
            <span class="text-xs font-medium text-[#4b5563]">Роль</span>
            <select v-model="form.role" :class="field">
              <option>Сотрудник</option>
              <option>Админ</option>
            </select>
          </label>
        </div>
        <template v-if="!isEdit">
          <div class="flex flex-col gap-2 rounded-lg border border-[#e8eaef] bg-[#fafbfc] p-3.5">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-[#4b5563]">Временный пароль</span>
              <button @click="tempPwd = gen()" class="text-xs text-brand hover:underline">
                Сгенерировать заново
              </button>
            </div>
            <div class="flex gap-2">
              <div
                class="flex h-[38px] flex-1 items-center rounded-lg border border-line bg-white px-3 font-mono text-sm tracking-wider"
              >
                {{ tempPwd }}
              </div>
              <button
                @click="copyPwd"
                class="h-[38px] rounded-lg border border-line bg-white px-3 text-xs hover:border-brand hover:text-brand"
              >
                Копировать
              </button>
            </div>
            <p class="text-[11.5px] leading-relaxed text-[#6b7280] text-pretty">
              Показывается один раз — передайте сотруднику лично. Email-рассылки нет.
            </p>
          </div>
        </template>
      </div>

      <div class="flex justify-end gap-2 border-t border-[#eceef2] bg-[#fafbfc] px-5 py-3.5">
        <button
          class="h-[38px] rounded-lg border border-line bg-white px-3.5 text-sm hover:border-[#9aa1ad]"
          @click="$emit('close')"
        >
          Отмена
        </button>
        <button
          @click="save"
          class="h-[38px] rounded-lg bg-brand px-4 text-sm font-medium text-white hover:bg-brand-hover"
        >
          {{ isEdit ? 'Сохранить' : 'Создать аккаунт' }}
        </button>
      </div>
    </div>
  </div>
</template>
