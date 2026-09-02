<script setup lang="ts">
// Модалка смены пароля: админ задаёт сотруднику новый пароль.
import { ref, reactive, computed } from 'vue'

const props = defineProps<{ name: string }>()
const emit = defineEmits<{ close: []; submit: [password: string] }>()

const field = 'h-[38px] rounded-lg border border-line px-3 text-sm outline-none focus:border-brand'
const invalid = '!border-[#c8442f]' // рамка невалидного поля

const form = reactive({ next: '', repeat: '' })
const submitted = ref(false)
const errors = computed(() => ({
  next: form.next.length < 8,
  repeat: !form.repeat || form.repeat !== form.next,
}))
const hasErrors = computed(() => Object.values(errors.value).some(Boolean))
const showError = (k: keyof typeof errors.value) => submitted.value && errors.value[k]

function save() {
  if (hasErrors.value) {
    submitted.value = true
    return
  }
  emit('submit', form.next)
  emit('close')
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/40 p-24 font-sans"
    @click.self="$emit('close')"
  >
    <div class="w-full max-w-[380px] overflow-hidden rounded-xl bg-white shadow-2xl">
      <div class="flex items-center justify-between border-b border-[#eceef2] px-5 py-4">
        <div class="text-base font-semibold">Смена пароля — {{ props.name }}</div>
        <button
          class="flex h-7 w-7 items-center justify-center rounded-md bg-[#f4f5f7] text-[#6b7280] hover:bg-[#eceef2]"
          @click="$emit('close')"
        >
          ✕
        </button>
      </div>

      <div class="flex flex-col gap-3.5 px-5 py-5">
        <label class="flex flex-col gap-1.5">
          <span class="text-xs font-medium text-[#4b5563]">Новый пароль</span>
          <input
            type="password"
            v-model="form.next"
            :class="[field, showError('next') && invalid]"
          />
          <span class="text-[11.5px] text-[#9aa1ad]">Минимум 8 символов</span>
        </label>
        <label class="flex flex-col gap-1.5">
          <span class="text-xs font-medium text-[#4b5563]">Повторите новый пароль</span>
          <input
            type="password"
            v-model="form.repeat"
            :class="[field, showError('repeat') && invalid]"
          />
        </label>
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
          Сменить пароль
        </button>
      </div>
    </div>
  </div>
</template>
