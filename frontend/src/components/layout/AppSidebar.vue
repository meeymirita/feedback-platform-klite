<script setup lang="ts">
// Боковое меню. Пункты — маршруты с meta.nav из router/index.ts.
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
// flatMap — разворачиваем на один уровень.
const nav = useRouter()
  .options.routes.flatMap((r) => r.children ?? [r])
  .filter((r) => r.meta?.nav)
</script>

<template>
  <aside
    class="flex h-screen w-[236px] flex-col gap-6 border-r border-[#e6e8ed] bg-white px-3.5 py-5 font-sans"
  >
    <!-- Лого -->
    <div class="flex items-center gap-2.5 px-2">
      <img src="@/assets/images/logo.png" alt="" class="h-6 w-6 rounded-md object-cover" />
      <span class="text-sm font-semibold tracking-[0.01em]">Отчётность</span>
    </div>

    <!-- Навигация -->
    <nav class="flex flex-col gap-0.5">
      <RouterLink
        v-for="item in nav"
        :key="item.path"
        :to="{ name: item.name }"
        class="rounded-md px-2.5 py-2 text-[13.5px]"
        :class="
          route.name === item.name
            ? 'bg-[#fbecea] font-semibold text-[#8f2521]'
            : 'text-[#3d434c] hover:bg-black/[0.03]'
        "
      >
        {{ item.meta?.label }}
      </RouterLink>
    </nav>

    <!-- Карточка пользователя -->
    <div class="mt-auto flex flex-col gap-3">
      <div class="flex items-center gap-2.5 rounded-lg border border-[#e8eaef] bg-[#fafbfc] p-2.5">
        <div
          class="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[#f8e8e6] text-xs font-semibold text-brand"
        >
          СА
        </div>
        <div class="min-w-0">
          <div class="truncate text-[12.5px] font-medium">Соколов Артём Игоревич</div>
          <div class="text-[11px] text-[#6b7280]">Сотрудник</div>
        </div>
      </div>
      <div class="flex gap-2">
        <button
          class="h-[30px] flex-1 rounded-md border border-line bg-white text-xs hover:border-brand hover:text-brand"
        >
          Пароль
        </button>
        <button
          class="h-[30px] flex-1 rounded-md border border-line bg-white text-xs hover:border-brand hover:text-brand"
        >
          Выйти
        </button>
      </div>
    </div>
  </aside>
</template>
