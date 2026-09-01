import { defineStore } from 'pinia'

export const useReportEntriesStore = defineStore('reportEntries', () => {
  // Демо-данные для вёрстки. Общий источник для «Мои записи» и «Недельный
  // отчёт» — это одни и те же записи, просто в разном виде.
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
  return { days }
})
