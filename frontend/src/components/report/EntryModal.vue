<script setup lang="ts">
// Модалка «Новая запись». Только вёрстка формы.
// Поля пока без v-model — добавишь v-model и отправку на бэкенд сам.
defineEmits<{ close: [] }>()

const field =
  'h-[38px] rounded-lg border border-line px-3 text-sm outline-none focus:border-brand'
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/40 p-16 font-sans"
    @click.self="$emit('close')"
  >
    <div class="w-full max-w-[520px] overflow-hidden rounded-xl bg-white shadow-2xl">
      <!-- Шапка -->
      <div class="flex items-center justify-between border-b border-[#eceef2] px-5 py-4">
        <div>
          <div class="text-base font-semibold">Новая запись</div>
          <div class="text-xs text-[#6b7280]">Одна задача = одна запись</div>
        </div>
        <button
          class="flex h-7 w-7 items-center justify-center rounded-md bg-[#f4f5f7] text-[#6b7280] hover:bg-[#eceef2]"
          @click="$emit('close')"
        >
          ✕
        </button>
      </div>

      <!-- Тело -->
      <div class="flex flex-col gap-4 px-5 py-5">
        <div class="grid grid-cols-2 gap-3.5">
          <label class="flex flex-col gap-1.5">
            <span class="text-xs font-medium text-[#4b5563]">Дата</span>
            <input type="date" :class="field" />
          </label>
          <label class="flex flex-col gap-1.5">
            <span class="text-xs font-medium text-[#4b5563]">Домен проекта</span>
            <input :class="field" placeholder="ggs-service.ru" />
          </label>
        </div>

        <label class="flex flex-col gap-1.5">
          <span class="text-xs font-medium text-[#4b5563]">Ссылка на задачу</span>
          <input
            :class="field"
            class="font-mono !text-[12.5px]"
            placeholder="https://kontur.bitrix24.ru/.../task/view/123123123/"
          />
        </label>

        <label class="flex flex-col gap-1.5">
          <span class="text-xs font-medium text-[#4b5563]">Что сделал</span>
          <textarea
            rows="3"
            class="resize-y rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
            placeholder="Коротко по факту: что именно сделано"
          ></textarea>
        </label>

        <div class="flex flex-col gap-2">
          <span class="text-xs font-medium text-[#4b5563]">Время на задачу</span>
          <div class="flex items-center gap-2">
            <button class="h-[38px] w-9 rounded-lg border border-line text-lg hover:border-brand">
              −
            </button>
            <input
              value="1:00"
              class="h-[38px] w-[86px] rounded-lg border border-line text-center font-mono text-sm outline-none focus:border-brand"
            />
            <button class="h-[38px] w-9 rounded-lg border border-line text-lg hover:border-brand">
              +
            </button>
            <div class="ml-2 flex gap-1.5">
              <button
                v-for="t in ['0:30', '1:00', '2:00', '4:00']"
                :key="t"
                class="h-[30px] rounded-md border border-line px-2.5 font-mono text-xs text-[#4b5563] hover:border-brand hover:text-brand"
              >
                {{ t }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Низ -->
      <div
        class="flex justify-end gap-2 border-t border-[#eceef2] bg-[#fafbfc] px-5 py-3.5"
      >
        <button
          class="h-[38px] rounded-lg border border-line bg-white px-3.5 text-sm hover:border-[#9aa1ad]"
          @click="$emit('close')"
        >
          Отмена
        </button>
        <button
          class="h-[38px] rounded-lg bg-brand px-4 text-sm font-medium text-white hover:bg-brand-hover"
        >
          Сохранить
        </button>
      </div>
    </div>
  </div>
</template>
