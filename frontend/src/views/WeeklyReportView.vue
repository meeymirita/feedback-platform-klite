<script setup lang="ts">
// Демо-данные. Те же записи, что в «Мои записи», только в виде таблицы.
const days = [
  {
    name: 'Понедельник',
    total: '5:25',
    rows: [
      { domain: 'ggs-service.ru', link: 'bitrix24 · #123123123', time: '1:55' },
      { domain: 'stena-nso.ru', link: 'bitrix24 · #123145900', time: '3:30' },
    ],
  },
  {
    name: 'Вторник',
    total: '5:20',
    rows: [
      { domain: 'condor-nsk.ru', link: 'bitrix24 · #123150411', time: '3:50' },
      { domain: 'dkedra.ru', link: 'bitrix24 · #123151002', time: '1:30' },
    ],
  },
  {
    name: 'Среда',
    total: '5:25',
    rows: [
      { domain: 'biomaster.pro', link: 'bitrix24 · #123160877', time: '3:00' },
      { domain: 'ggs-service.ru', link: 'bitrix24 · #123161340', time: '2:25' },
    ],
  },
  {
    name: 'Четверг',
    total: '5:40',
    rows: [
      { domain: 'stena-nso.ru', link: 'bitrix24 · #123170255', time: '4:25' },
      { domain: 'dkedra.ru', link: 'bitrix24 · #123170980', time: '1:15' },
    ],
  },
  {
    name: 'Пятница',
    total: '5:45',
    rows: [
      { domain: 'condor-nsk.ru', link: 'bitrix24 · #123180114', time: '3:15' },
      { domain: 'biomaster.pro', link: 'bitrix24 · #123180677', time: '2:30' },
    ],
  },
]
</script>

<template>
  <main class="min-w-0 flex-1 px-8 py-7">
    <div class="mx-auto flex max-w-[1020px] flex-col gap-5">
      <!-- Заголовок -->
      <div class="flex flex-wrap items-end justify-between gap-6">
        <div class="flex flex-col gap-1.5">
          <h1 class="text-[21px] font-semibold tracking-[-0.01em]">Недельный отчёт</h1>
          <p class="text-[13px] text-[#6b7280]">
            Рабочая неделя Пн–Пт. Только просмотр и выгрузка.
          </p>
        </div>
        <button
          class="h-[38px] rounded-lg bg-ink px-4 text-[13.5px] font-medium text-white hover:bg-black"
        >
          Скачать в Excel
        </button>
      </div>

      <!-- Неделя -->
      <div
        class="flex items-center justify-between gap-4 rounded-[9px] border border-[#e6e8ed] bg-white px-3.5 py-2.5"
      >
        <div class="flex items-center gap-2.5">
          <button class="h-[30px] w-[30px] rounded-md border border-line hover:border-brand">
            ←
          </button>
          <span class="min-w-[172px] text-center font-mono text-[13px] font-medium">
            31.08 — 04.09.2026
          </span>
          <button class="h-[30px] w-[30px] rounded-md border border-line hover:border-brand">
            →
          </button>
        </div>
        <span class="text-xs text-[#6b7280]">Соколов Артём Игоревич</span>
      </div>

      <!-- Таблица -->
      <div class="overflow-hidden rounded-[9px] border border-[#e6e8ed] bg-white">
        <!-- Шапка таблицы -->
        <div
          class="grid grid-cols-[150px_1fr_320px_96px] gap-4 border-b border-[#e6e8ed] bg-[#fafbfc] px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.06em] text-[#6b7280]"
        >
          <div>День</div>
          <div>Задача (домен)</div>
          <div>Ссылка</div>
          <div class="text-right">Время</div>
        </div>

        <!-- Группы по дням -->
        <div v-for="day in days" :key="day.name" class="border-b border-[#eceef2]">
          <div
            v-for="(row, i) in day.rows"
            :key="i"
            class="grid grid-cols-[150px_1fr_320px_96px] gap-4 border-t border-[#f4f5f7] px-4 py-2.5 first:border-t-0"
          >
            <div class="text-[13.5px]" :class="i === 0 ? 'font-semibold' : 'text-[#9aa1ad]'">
              {{ i === 0 ? day.name : '' }}
            </div>
            <div class="truncate text-[13.5px]">{{ row.domain }}</div>
            <a href="#" class="truncate font-mono text-[11.5px] text-brand hover:underline">
              {{ row.link }}
            </a>
            <div class="text-right font-mono text-[13.5px]">{{ row.time }}</div>
          </div>

          <!-- Итог по дню -->
          <div
            class="grid grid-cols-[150px_1fr_96px] gap-4 border-t border-[#eceef2] bg-[#f7f8fb] px-4 py-2"
          >
            <div></div>
            <div class="text-right text-xs text-[#6b7280]">Итого за день</div>
            <div class="text-right font-mono text-[13px] font-medium">{{ day.total }}</div>
          </div>
        </div>

        <!-- Итог за неделю -->
        <div class="grid grid-cols-[1fr_96px] gap-4 bg-ink px-4 py-3.5 text-white">
          <div class="text-[13px] font-semibold">Итого за неделю · 10 записей</div>
          <div class="text-right font-mono text-[15px] font-medium">27:35</div>
        </div>
      </div>
    </div>
  </main>
</template>
