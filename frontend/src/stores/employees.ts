import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useEmployeesStore = defineStore('employees', () => {
  // Демо-данные для вёрстки. `active: false` — заблокированный сотрудник.
  // ref() обязателен: без него Pinia не считает это состоянием, и
  // storeToRefs() во view просто не найдёт employees.
  const employees = ref([
    {
      initials: 'СА',
      name: 'Соколов Артём Игоревич',
      email: 'a.sokolov@kontur-group.ru',
      role: 'Сотрудник',
      last: '31.08.2026',
      active: true,
    },
    {
      initials: 'МД',
      name: 'Мельникова Дарья Сергеевна',
      email: 'd.melnikova@kontur-group.ru',
      role: 'Сотрудник',
      last: '31.08.2026',
      active: true,
    },
    {
      initials: 'ГН',
      name: 'Гаврилов Никита Павлович',
      email: 'n.gavrilov@kontur-group.ru',
      role: 'Сотрудник',
      last: '28.08.2026',
      active: false,
    },
    {
      initials: 'ТО',
      name: 'Ткачук Ольга Владимировна',
      email: 'o.tkachuk@kontur-group.ru',
      role: 'Админ',
      last: '31.08.2026',
      active: true,
    },
    {
      initials: 'ЕП',
      name: 'Ерёмин Павел Андреевич',
      email: 'p.eremin@kontur-group.ru',
      role: 'Сотрудник',
      last: '—',
      active: true,
    },
  ])
  return { employees }
})
