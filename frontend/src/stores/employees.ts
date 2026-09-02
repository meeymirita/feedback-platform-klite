import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Employee } from '@/types/employee'

type NewEmployee = Pick<Employee, 'name' | 'email' | 'role'>

export const useEmployeesStore = defineStore('employees', () => {
  // Демо-данные для вёрстки. ref() обязателен: без него Pinia не считает это
  // состоянием, и storeToRefs() во view просто не найдёт employees.
  const employees = ref<Employee[]>([
    {
      id: '1',
      initials: 'СА',
      name: 'Соколов Артём Игоревич',
      email: 'a.sokolov@kontur-group.ru',
      role: 'Сотрудник',
      last: '31.08.2026',
    },
    {
      id: '2',
      initials: 'МД',
      name: 'Мельникова Дарья Сергеевна',
      email: 'd.melnikova@kontur-group.ru',
      role: 'Сотрудник',
      last: '31.08.2026',
    },
    {
      id: '3',
      initials: 'ГН',
      name: 'Гаврилов Никита Павлович',
      email: 'n.gavrilov@kontur-group.ru',
      role: 'Сотрудник',
      last: '28.08.2026',
    },
    {
      id: '4',
      initials: 'ТО',
      name: 'Ткачук Ольга Владимировна',
      email: 'o.tkachuk@kontur-group.ru',
      role: 'Админ',
      last: '31.08.2026',
    },
    {
      id: '5',
      initials: 'ЕП',
      name: 'Ерёмин Павел Андреевич',
      email: 'p.eremin@kontur-group.ru',
      role: 'Сотрудник',
      last: '—',
    },
  ])

  // инициалы всегда выводим из ФИО, руками не вводим
  function initialsFrom(name: string): string {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('')
  }

  function addEmployee(data: NewEmployee) {
    employees.value.push({
      id: crypto.randomUUID(),
      initials: initialsFrom(data.name),
      ...data,
      last: '—',
    })
  }
  function updateEmployee(id: string, patch: Partial<NewEmployee>) {
    const e = employees.value.find((x) => x.id === id)
    if (!e) return
    Object.assign(e, patch)
    if (patch.name) e.initials = initialsFrom(patch.name)
  }
  // демо без бэка — пароль никуда не сохраняется; заглушка под будущий API
  function setPassword(id: string, password: string) {
    console.info('setPassword (демо):', id, password.length + ' символов')
  }

  return { employees, addEmployee, updateEmployee, setPassword }
})
