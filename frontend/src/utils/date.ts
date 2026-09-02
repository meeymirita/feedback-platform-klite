export function weekdayName(dmy: string): string {
  const [d, m, y] = dmy.split('.').map(Number)
  const n = new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('ru-RU', {
    weekday: 'long',
  })
  return n.charAt(0).toUpperCase() + n.slice(1)
}
