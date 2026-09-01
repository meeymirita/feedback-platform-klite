<script setup lang="ts">
import { ref } from 'vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import EntryModal from '@/components/report/EntryModal.vue'

// Демо-данные для вёрстки. Потом заменишь на данные с бэкенда.
const days = [
  {
    name: 'Понедельник',
    date: '31.08.2026',
    total: '5:25',
    rows: [
      {
        domain: 'ggs-service.ru',
        link: 'bitrix24 · #123123123',
        desc: 'Правки на главной: заменил баннер, пересобрал блок услуг',
        time: '1:55',
      },
      {
        domain: 'stena-nso.ru',
        link: 'bitrix24 · #123145900',
        desc: 'Собрал каталог из выгрузки, настроил фильтры по типу панелей',
        time: '3:30',
      },
    ],
  },
  {
    name: 'Вторник',
    date: '01.09.2026',
    total: '5:20',
    rows: [
      {
        domain: 'condor-nsk.ru',
        link: 'bitrix24 · #123150411',
        desc: 'Перенёс сайт на новый хостинг, проверил редиректы и SSL',
        time: '3:50',
      },
      {
        domain: 'dkedra.ru',
        link: 'bitrix24 · #123151002',
        desc: 'Правки в форме заявки, подключил уведомления на почту',
        time: '1:30',
      },
    ],
  },
  {
    name: 'Среда',
    date: '02.09.2026',
    total: '5:25',
    rows: [
      {
        domain: 'biomaster.pro',
        link: 'bitrix24 · #123160877',
        desc: 'Вёрстка страницы «Оборудование» по макету',
        time: '3:00',
      },
      {
        domain: 'ggs-service.ru',
        link: 'bitrix24 · #123161340',
        desc: 'Скорость загрузки: сжал изображения, отложил сторонние скрипты',
        time: '2:25',
      },
    ],
  },
  {
    name: 'Четверг',
    date: '03.09.2026',
    total: '5:40',
    rows: [
      {
        domain: 'stena-nso.ru',
        link: 'bitrix24 · #123170255',
        desc: 'Интеграция с 1С: сопоставил номенклатуру, настроил расписание обмена',
        time: '4:25',
      },
      {
        domain: 'dkedra.ru',
        link: 'bitrix24 · #123170980',
        desc: 'Мелкие правки по замечаниям заказчика',
        time: '1:15',
      },
    ],
  },
  {
    name: 'Пятница',
    date: '04.09.2026',
    total: '5:45',
    rows: [
      {
        domain: 'condor-nsk.ru',
        link: 'bitrix24 · #123180114',
        desc: 'Настроил цели в Метрике, собрал отчёт по заявкам за август',
        time: '3:15',
      },
      {
        domain: 'biomaster.pro',
        link: 'bitrix24 · #123180677',
        desc: 'Обновил каталог: 24 новых товара, перепроверил цены',
        time: '2:30',
      },
    ],
  },
]

const showEntryModal = ref(false)
</script>

<template>
  <div class="flex min-h-screen bg-[#f5f6f8] font-sans text-ink">
    <AppSidebar active="entries" />

    <main class="min-w-0 flex-1 px-8 py-7">
      <div class="mx-auto flex max-w-[1020px] flex-col gap-5">
        <!-- Заголовок -->
        <div class="flex flex-wrap items-end justify-between gap-6">
          <div class="flex flex-col gap-1.5">
            <h1 class="text-[21px] font-semibold tracking-[-0.01em]">Мои записи</h1>
            <p class="text-[13px] text-[#6b7280]">
              Одна задача — одна запись. Редактировать можно за любой прошедший день.
            </p>
          </div>
          <button
            class="h-[38px] rounded-lg bg-brand px-4 text-[13.5px] font-medium text-white hover:bg-brand-hover"
            @click="showEntryModal = true"
          >
            ＋ Добавить запись
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
            <span class="text-xs text-[#9aa1ad]">текущая неделя</span>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-xs text-[#6b7280]">Итого за неделю</span>
            <span class="font-mono text-[15px] font-medium">27:35</span>
          </div>
        </div>

        <!-- Дни -->
        <div class="flex flex-col gap-3">
          <div
            v-for="day in days"
            :key="day.date"
            class="overflow-hidden rounded-[9px] border border-[#e6e8ed] bg-white"
          >
            <!-- Шапка дня -->
            <div
              class="flex items-center justify-between gap-4 border-b border-[#eceef2] bg-[#fafbfc] px-4 py-2.5"
            >
              <div class="flex items-baseline gap-2.5">
                <span class="text-[13.5px] font-semibold">{{ day.name }}</span>
                <span class="font-mono text-xs text-[#9aa1ad]">{{ day.date }}</span>
                <span class="text-xs text-[#9aa1ad]">{{ day.rows.length }} записи</span>
              </div>
              <span class="font-mono text-[13px] font-medium">{{ day.total }}</span>
            </div>

            <!-- Строки -->
            <div
              v-for="(row, i) in day.rows"
              :key="i"
              class="grid grid-cols-[170px_1fr_78px_130px] items-start gap-4 border-t border-[#f1f2f5] px-4 py-3 first:border-t-0 hover:bg-[#fafbfc]"
            >
              <div class="min-w-0">
                <div class="truncate text-[13.5px] font-medium">{{ row.domain }}</div>
                <a href="#" class="font-mono text-[11px] text-brand hover:underline">
                  {{ row.link }}
                </a>
              </div>
              <div class="text-[13px] leading-relaxed text-[#3d434c] text-pretty">
                {{ row.desc }}
              </div>
              <div class="text-right font-mono text-[13.5px]">{{ row.time }}</div>
              <div class="flex justify-end gap-3">
                <button class="text-[12.5px] text-[#6b7280] hover:text-brand">Изменить</button>
                <button class="text-[12.5px] text-[#9aa1ad] hover:text-[#c8442f]">Удалить</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <EntryModal v-if="showEntryModal" @close="showEntryModal = false" />
  </div>
</template>
