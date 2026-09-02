// Работа с датами формата 'ДД.ММ.ГГГГ' (как в демо-данных) и рабочей неделей Пн–Пт.

// '31.08.2026' -> Date
export function parseDmy(dmy: string): Date {
  const [d = 0, m = 0, y = 0] = dmy.split('.').map(Number)
  return new Date(y, m - 1, d)
}

// '31.08.2026' -> 'Понедельник'
export function weekdayName(dmy: string): string {
  const n = parseDmy(dmy).toLocaleDateString('ru-RU', { weekday: 'long' })
  return n.charAt(0).toUpperCase() + n.slice(1)
}

// '31.08.2026' -> '2026-08-31' (для <input type="date">)
export function toISODate(dmy: string): string {
  const [d, m, y] = dmy.split('.')
  return `${y}-${m}-${d}`
}

// '2026-08-31' -> '31.08.2026' (обратно, в стор)
export function fromISODate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

// Date -> 'YYYY-MM-DD' по локальным частям (без сдвига на UTC).
export function isoLocal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// сегодня в 'YYYY-MM-DD' (для дефолта в <input type="date">)
export function todayISO(): string {
  return isoLocal(new Date())
}

// day of week: 0=Вс, 6=Сб. Принимает 'YYYY-MM-DD'.
export function isWeekend(iso: string): boolean {
  const [y = 0, m = 0, d = 0] = iso.split('-').map(Number)
  const day = new Date(y, m - 1, d).getDay()
  return day === 0 || day === 6
}

// понедельник (00:00) недели, содержащей d
export function mondayOf(d: Date): Date {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const day = r.getDay() // 0=Вс..6=Сб
  return addDays(r, day === 0 ? -6 : 1 - day)
}

// понедельник -> 'ДД.ММ — ДД.ММ.ГГГГ' (Пн–Пт)
export function weekRangeLabel(monday: Date): string {
  const dd = (n: number) => String(n).padStart(2, '0')
  const fri = addDays(monday, 4)
  return (
    `${dd(monday.getDate())}.${dd(monday.getMonth() + 1)} — ` +
    `${dd(fri.getDate())}.${dd(fri.getMonth() + 1)}.${fri.getFullYear()}`
  )
}
