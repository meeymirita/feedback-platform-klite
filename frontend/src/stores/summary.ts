import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useSummaryStore = defineStore('summary', () => {
  // Демо-данные для вёрстки. `pct` — ширина полоски загрузки в процентах.
  // ref() обязателен: без него Pinia не считает это состоянием, и
  // storeToRefs() во view просто не найдёт summary.
  const summary = ref([
    { initials: 'СА', name: 'Соколов Артём Игоревич', count: 10, total: '27:35', pct: 69 },
    { initials: 'МД', name: 'Мельникова Дарья Сергеевна', count: 8, total: '21:30', pct: 54 },
    { initials: 'ГН', name: 'Гаврилов Никита Павлович', count: 0, total: '0:00', pct: 0 },
    { initials: 'ТО', name: 'Ткачук Ольга Владимировна', count: 4, total: '10:40', pct: 27 },
    { initials: 'ЕП', name: 'Ерёмин Павел Андреевич', count: 0, total: '0:00', pct: 0 },
  ])
  return { summary }
})
