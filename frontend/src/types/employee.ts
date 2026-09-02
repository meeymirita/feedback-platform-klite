export interface Employee {
  id: string // по нему :key и поиск в сторе
  initials: string // выводим из name, руками не вводим
  name: string
  email: string
  role: 'Сотрудник' | 'Админ'
  last: string // дата последней записи или '—'
}
