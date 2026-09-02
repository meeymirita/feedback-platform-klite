import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { ReportEntry, ReportDay } from '@/types/report'
import { toMinutes, fromMinutes } from '@/utils/time'
import { weekdayName, parseDmy, addDays, mondayOf, weekRangeLabel } from '@/utils/date'

export const useReportEntriesStore = defineStore('reportEntries', () => {
  const entries = ref<ReportEntry[]>([
    {
      id: '1',
      date: '31.08.2026',
      domain: 'ggs-service.ru',
      link: 'bitrix24 · #123123123',
      desc: 'Правки на главной: заменил баннер, пересобрал блок услуг',
      time: '1:55',
    },
    {
      id: '2',
      date: '31.08.2026',
      domain: 'stena-nso.ru',
      link: 'bitrix24 · #123145900',
      desc: 'Собрал каталог из выгрузки, настроил фильтры по типу панелей',
      time: '3:30',
    },
    {
      id: '3',
      date: '01.09.2026',
      domain: 'condor-nsk.ru',
      link: 'bitrix24 · #123150411',
      desc: 'Перенёс сайт на новый хостинг, проверил редиректы и SSL',
      time: '3:50',
    },
    {
      id: '4',
      date: '01.09.2026',
      domain: 'dkedra.ru',
      link: 'bitrix24 · #123151002',
      desc: 'Правки в форме заявки, подключил уведомления на почту',
      time: '1:30',
    },
    {
      id: '5',
      date: '02.09.2026',
      domain: 'biomaster.pro',
      link: 'bitrix24 · #123160877',
      desc: 'Вёрстка страницы «Оборудование» по макету',
      time: '3:00',
    },
    {
      id: '6',
      date: '02.09.2026',
      domain: 'ggs-service.ru',
      link: 'bitrix24 · #123161340',
      desc: 'Скорость загрузки: сжал изображения, отложил сторонние скрипты',
      time: '2:25',
    },
    {
      id: '7',
      date: '03.09.2026',
      domain: 'stena-nso.ru',
      link: 'bitrix24 · #123170255',
      desc: 'Интеграция с 1С: сопоставил номенклатуру, настроил расписание обмена',
      time: '4:25',
    },
    {
      id: '8',
      date: '03.09.2026',
      domain: 'dkedra.ru',
      link: 'bitrix24 · #123170980',
      desc: 'Мелкие правки по замечаниям заказчика',
      time: '1:15',
    },
    {
      id: '9',
      date: '04.09.2026',
      domain: 'condor-nsk.ru',
      link: 'bitrix24 · #123180114',
      desc: 'Настроил цели в Метрике, собрал отчёт по заявкам за август',
      time: '3:15',
    },
    {
      id: '10',
      date: '04.09.2026',
      domain: 'biomaster.pro',
      link: 'bitrix24 · #123180677',
      desc: 'Обновил каталог: 24 новых товара, перепроверил цены',
      time: '2:30',
    },
    // предыдущая неделя (Пн 24.08 — Пт 28.08.2026)
    {
      id: 'p1',
      date: '24.08.2026',
      domain: 'ggs-service.ru',
      link: 'bitrix24 · #123090114',
      desc: 'Настроил форму обратной связи, подключил антиспам',
      time: '2:10',
    },
    {
      id: 'p2',
      date: '25.08.2026',
      domain: 'dkedra.ru',
      link: 'bitrix24 · #123091250',
      desc: 'Обновил раздел новостей и галерею объектов',
      time: '1:40',
    },
    {
      id: 'p3',
      date: '26.08.2026',
      domain: 'condor-nsk.ru',
      link: 'bitrix24 · #123092777',
      desc: 'SEO-правки: мета-теги, микроразметка каталога',
      time: '3:20',
    },
    {
      id: 'p4',
      date: '27.08.2026',
      domain: 'stena-nso.ru',
      link: 'bitrix24 · #123093140',
      desc: 'Интеграция оплаты, прогнал тестовые платежи',
      time: '4:00',
    },
    {
      id: 'p5',
      date: '28.08.2026',
      domain: 'biomaster.pro',
      link: 'bitrix24 · #123094905',
      desc: 'Правки по замечаниям заказчика, выкатил на прод',
      time: '2:35',
    },
  ])

  const weekOffset = ref(0) // 0 — неделя с «сегодня», −1 предыдущая, …
  const weekStart = computed(() => addDays(mondayOf(new Date()), weekOffset.value * 7))
  const isCurrentWeek = computed(() => weekOffset.value === 0)
  const canGoNext = computed(() => weekOffset.value < 0) // вперёд текущей не пускаем
  function prevWeek() {
    weekOffset.value--
  }
  function nextWeek() {
    if (canGoNext.value) weekOffset.value++
  }
  const weekEntries = computed(() => {
    const start = weekStart.value
    const end = addDays(start, 5) // [start, start+5) = Пн..Пт
    return entries.value.filter((e) => {
      const t = parseDmy(e.date)
      return t >= start && t < end
    })
  })
  const weekLabel = computed(() => weekRangeLabel(weekStart.value))

  const days = computed<ReportDay[]>(() => {
    const byDate = new Map<string, ReportEntry[]>()
    for (const e of weekEntries.value) {
      if (!byDate.has(e.date)) byDate.set(e.date, [])
      byDate.get(e.date)!.push(e)
    }
    return [...byDate.entries()]
      .sort((a, b) => +parseDmy(a[0]) - +parseDmy(b[0]))
      .map(([date, rows]) => ({
        name: weekdayName(date),
        date,
        total: fromMinutes(rows.reduce((s, r) => s + toMinutes(r.time), 0)),
        rows,
      }))
  })

  function addEntry(data: Omit<ReportEntry, 'id'>) {
    entries.value.push({ id: crypto.randomUUID(), ...data })
  }
  function updateEntry(id: string, patch: Partial<Omit<ReportEntry, 'id'>>) {
    const e = entries.value.find((x) => x.id === id)
    if (e) Object.assign(e, patch)
  }
  function deleteEntry(id: string) {
    entries.value = entries.value.filter((x) => x.id !== id)
  }
  const weekTotal = computed(() =>
    fromMinutes(weekEntries.value.reduce((s, e) => s + toMinutes(e.time), 0)),
  )
  const weekCount = computed(() => weekEntries.value.length)

  return {
    entries,
    days,
    addEntry,
    updateEntry,
    deleteEntry,
    weekLabel,
    weekTotal,
    weekCount,
    isCurrentWeek,
    canGoNext,
    prevWeek,
    nextWeek,
  }
})
