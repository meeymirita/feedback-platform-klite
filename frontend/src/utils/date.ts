export function weekdayName(dmy: string): string {
  const [d, m, y] = dmy.split('.').map(Number)
  const n = new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('ru-RU', {
    weekday: 'long',
  })
  return n.charAt(0).toUpperCase() + n.slice(1)
}
// '31.08.2026' -> '2026-08-31'  (в <input type="date">)
export function toISODate(dmy: string): string {
  const [d, m, y] = dmy.split('.')
  return `${y}-${m}-${d}`
}
// '2026-08-31' -> '31.08.2026'  (обратно, в стор)
export function fromISODate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}
