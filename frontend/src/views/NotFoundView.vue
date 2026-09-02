<script setup lang="ts">
// Экран 404. Вёрстка по макету из Claude Design: двухколоночный, как экран входа.
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push({ name: 'entries' })
}
</script>

<template>
  <main
    class="grid min-h-screen grid-cols-1 overflow-hidden bg-white font-sans text-ink lg:grid-cols-2"
  >
    <!-- Левая колонка — контент -->
    <section class="relative z-[2] flex flex-col justify-between p-8 lg:px-[52px] lg:py-11">
      <!-- Лого -->
      <div class="flex items-center gap-2.5">
        <img src="@/assets/images/logo.png" alt="" class="h-6 w-6 rounded-md object-cover" />
        <span class="text-sm font-semibold tracking-[0.01em]">Отчётность</span>
      </div>

      <!-- Центральный блок -->
      <div class="flex max-w-[460px] flex-col gap-[26px] py-10">
        <!-- Метка -->
        <div class="flex items-center gap-3">
          <span class="h-0.5 w-[26px] bg-brand"></span>
          <span class="font-mono text-[11.5px] uppercase tracking-[0.16em] text-brand">
            ошибка 404
          </span>
        </div>

        <!-- Крупная 404 -->
        <div class="relative">
          <div
            class="flicker text-[96px] font-bold leading-[0.86] tracking-[-0.05em] text-ink sm:text-[132px]"
          >
            4<span class="text-brand">0</span>4
          </div>
          <div
            class="absolute left-1 top-[26%] h-3 w-[190px] -skew-x-[22deg] bg-brand opacity-[0.16]"
          ></div>
        </div>

        <!-- Заголовок + описание -->
        <div class="flex flex-col gap-3">
          <div class="text-[24px] font-semibold tracking-[-0.01em] text-pretty">
            Такой страницы здесь нет
          </div>
          <div class="text-[14.5px] leading-[1.65] text-[#5b6270] text-pretty">
            Ссылка устарела или отчёт удалён. Проверьте адрес или вернитесь к своим записям — данные
            на месте.
          </div>
        </div>

        <!-- Кнопки -->
        <div class="flex flex-wrap gap-2.5">
          <RouterLink
            :to="{ name: 'entries' }"
            class="inline-flex h-[42px] items-center rounded-lg bg-brand px-5 text-sm font-medium text-white hover:bg-brand-hover"
          >
            На главную
          </RouterLink>
          <button
            type="button"
            class="h-[42px] rounded-lg border border-[#e4d6d4] bg-white px-[18px] text-sm text-ink hover:border-brand"
            @click="goBack"
          >
            Назад
          </button>
        </div>

        <!-- Поддержка -->
        <div class="flex flex-wrap items-center gap-2.5 border-t border-[#f0eaea] pt-5">
          <span class="text-[12.5px] text-[#9aa1ad]">Не нашли нужный отчёт?</span>
          <a href="mailto:support@kontur-group.ru" class="text-[12.5px] text-brand hover:underline">
            Написать администратору
          </a>
        </div>
      </div>

      <!-- Путь, по которому пришёл пользователь -->
      <div class="font-mono text-[11px] text-[#b9bfc8]">{{ route.fullPath }}</div>
    </section>

    <!-- Правая колонка — декор -->
    <section
      class="relative hidden items-end justify-center overflow-hidden lg:flex"
    >
      <!-- Плавающие фигуры -->
      <span class="shape shape-1"></span>
      <span class="shape shape-2"></span>
      <span class="shape shape-3"></span>

      <!-- Иллюстрация -->
      <div class="relative z-[1] flex h-full w-full items-end justify-center px-7 pt-9">
        <img src="@/assets/images/404.webp" alt="" class="h-full w-full object-contain" />
      </div>
    </section>
  </main>
</template>

<style scoped>
@keyframes drift {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-14px) rotate(6deg);
  }
}
@keyframes flicker {
  0%,
  92%,
  100% {
    opacity: 1;
  }
  94% {
    opacity: 0.35;
  }
  96% {
    opacity: 0.9;
  }
}

.flicker {
  animation: flicker 6s ease-in-out infinite;
}

.shape {
  position: absolute;
  clip-path: polygon(50% 0, 100% 38%, 72% 100%, 28% 100%, 0 38%);
}
.shape-1 {
  left: 12%;
  top: 16%;
  width: 14px;
  height: 14px;
  background: var(--color-brand);
  opacity: 0.55;
  animation: drift 7s ease-in-out infinite;
}
.shape-2 {
  right: 18%;
  top: 30%;
  width: 10px;
  height: 10px;
  background: var(--color-ink);
  opacity: 0.4;
  animation: drift 9s ease-in-out infinite;
}
.shape-3 {
  right: 28%;
  bottom: 16%;
  width: 12px;
  height: 12px;
  background: var(--color-brand);
  opacity: 0.4;
  animation: drift 8s ease-in-out 0.8s infinite;
}
</style>
