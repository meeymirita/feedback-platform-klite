<script setup lang="ts">
import { ref } from 'vue'

const email = ref('a.sokolov@kontur-group.ru')
const password = ref('')

// Общие классы для полей ввода — чтобы не дублировать.
const fieldClass =
  'h-10 rounded-lg border border-line bg-white px-3 text-sm outline-none ' +
  'focus:border-brand focus:ring-1 focus:ring-brand'

function onSubmit() {
  // TODO: POST /auth/login — см. docs/PLAN.md, фаза 2 (сессии в Redis).
  console.log('login', { email: email.value, password: password.value })
}

function loginAs(role: 'employee' | 'admin') {
  // Прототип: быстрый вход без бэкенда.
  console.log('login as', role)
}
</script>

<template>
  <main class="grid min-h-screen font-sans lg:grid-cols-2">
    <!-- Левая панель — описание сервиса -->
    <section
      class="flex flex-col justify-between bg-ink px-8 py-12 text-[#f5f6f8] lg:px-[60px] lg:py-14"
    >
      <div class="flex items-center gap-3">
        <div class="h-7 w-7 rounded-[7px] bg-brand"></div>
        <span class="text-[15px] font-semibold tracking-[0.01em]">Отчётность</span>
      </div>

      <div class="flex max-w-[420px] flex-col gap-5">
        <h1
          class="text-3xl font-semibold leading-[1.15] tracking-[-0.02em] text-pretty lg:text-[34px]"
        >
          Ежедневная и еженедельная отчётность
        </h1>
        <p class="text-[15px] leading-relaxed text-[#9aa1ad] text-pretty">
          Одна запись — одна задача. В конце недели записи собираются в отчёт и
          выгружаются в Excel.
        </p>
      </div>

      <p class="font-mono text-xs text-[#6b7280]">Внутренний сервис компании</p>
    </section>

    <!-- Правая панель — форма входа -->
    <section class="flex items-center justify-center bg-white px-6 py-12 text-ink lg:px-10">
      <div class="flex w-full max-w-[352px] flex-col gap-[22px]">
        <div class="flex flex-col gap-1.5">
          <h2 class="text-[22px] font-semibold tracking-[-0.01em]">Вход</h2>
          <p class="text-[13px] text-[#6b7280]">Введите рабочий email и пароль</p>
        </div>

        <form class="flex flex-col gap-3.5" @submit.prevent="onSubmit">
          <label for="email" class="flex flex-col gap-1.5">
            <span class="text-xs font-medium text-[#4b5563]">Email</span>
            <input
              id="email"
              v-model="email"
              type="email"
              autocomplete="username"
              :class="fieldClass"
            />
          </label>

          <label for="password" class="flex flex-col gap-1.5">
            <span class="text-xs font-medium text-[#4b5563]">Пароль</span>
            <input
              id="password"
              v-model="password"
              type="password"
              autocomplete="current-password"
              placeholder="••••••••••"
              :class="fieldClass"
            />
          </label>

          <button
            type="submit"
            class="h-[42px] rounded-lg bg-brand text-sm font-medium text-white transition-colors hover:bg-brand-hover"
          >
            Войти
          </button>
        </form>

        <p
          class="rounded-lg border border-[#e8eaef] bg-[#fafbfc] px-3.5 py-3 text-[12.5px] leading-relaxed text-[#6b7280] text-pretty"
        >
          Забыли пароль — обратитесь к администратору. Самостоятельная регистрация
          и восстановление по email не предусмотрены.
        </p>

        <div class="flex flex-col gap-2 border-t border-dashed border-[#e2e5ea] pt-1.5">
          <div
            class="font-mono text-[10.5px] uppercase tracking-[0.06em] text-[#9aa1ad]"
          >
            прототип — войти как
          </div>
          <div class="flex gap-2">
            <button
              type="button"
              class="h-[34px] flex-1 rounded-[7px] border border-line bg-white text-[13px] hover:bg-black/[0.03]"
              @click="loginAs('employee')"
            >
              Сотрудник
            </button>
            <button
              type="button"
              class="h-[34px] flex-1 rounded-[7px] border border-line bg-white text-[13px] hover:bg-black/[0.03]"
              @click="loginAs('admin')"
            >
              Админ
            </button>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
