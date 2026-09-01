<script setup lang="ts">
// Модалка «Новый сотрудник». Только вёрстка.
defineEmits<{ close: [] }>()

const field =
  'h-[38px] rounded-lg border border-line px-3 text-sm outline-none focus:border-brand'
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/40 p-16 font-sans"
    @click.self="$emit('close')"
  >
    <div class="w-full max-w-[460px] overflow-hidden rounded-xl bg-white shadow-2xl">
      <div class="flex items-center justify-between border-b border-[#eceef2] px-5 py-4">
        <div>
          <div class="text-base font-semibold">Новый сотрудник</div>
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
          <input :class="field" placeholder="Соколов Артём Игоревич" />
        </label>

        <div class="grid grid-cols-[1fr_150px] gap-3.5">
          <label class="flex flex-col gap-1.5">
            <span class="text-xs font-medium text-[#4b5563]">Email (логин)</span>
            <input :class="field" class="font-mono !text-[12.5px]" placeholder="name@kontur-group.ru" />
          </label>
          <label class="flex flex-col gap-1.5">
            <span class="text-xs font-medium text-[#4b5563]">Роль</span>
            <select :class="field">
              <option>Сотрудник</option>
              <option>Админ</option>
            </select>
          </label>
        </div>

        <div class="flex flex-col gap-2 rounded-lg border border-[#e8eaef] bg-[#fafbfc] p-3.5">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-[#4b5563]">Временный пароль</span>
            <button class="text-xs text-brand hover:underline">Сгенерировать заново</button>
          </div>
          <div class="flex gap-2">
            <div
              class="flex h-[38px] flex-1 items-center rounded-lg border border-line bg-white px-3 font-mono text-sm tracking-wider"
            >
              kf7mqx2r9p
            </div>
            <button
              class="h-[38px] rounded-lg border border-line bg-white px-3 text-xs hover:border-brand hover:text-brand"
            >
              Копировать
            </button>
          </div>
          <p class="text-[11.5px] leading-relaxed text-[#6b7280] text-pretty">
            Показывается один раз — передайте сотруднику лично. Email-рассылки нет.
          </p>
        </div>
      </div>

      <div class="flex justify-end gap-2 border-t border-[#eceef2] bg-[#fafbfc] px-5 py-3.5">
        <button
          class="h-[38px] rounded-lg border border-line bg-white px-3.5 text-sm hover:border-[#9aa1ad]"
          @click="$emit('close')"
        >
          Отмена
        </button>
        <button
          class="h-[38px] rounded-lg bg-brand px-4 text-sm font-medium text-white hover:bg-brand-hover"
        >
          Создать аккаунт
        </button>
      </div>
    </div>
  </div>
</template>
