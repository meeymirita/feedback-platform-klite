export interface Employee {
  initials: string
  name: string
  email: string
  role: 'Сотрудник' | 'Админ'
  last: string // дата последней записи или '—'
  active: boolean // false — заблокирован
}
