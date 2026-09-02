export interface ReportEntry {
  id: string
  employeeId: string // чья запись — id из stores/employees
  date: string // 'ДД.ММ.ГГГГ' — пока строка, как в демо
  domain: string
  link: string // 'bitrix24 · #123123123' — метка, пока не URL
  desc: string
  time: string // 'ч:мм'
}
export interface ReportDay {
  name: string // 'Понедельник'…'Пятница' — из даты
  date: string
  total: string // сумма time за день, 'ч:мм'
  rows: ReportEntry[]
}
