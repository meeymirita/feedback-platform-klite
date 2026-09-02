export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return Number(h) * 60 + Number(m)
}
export function fromMinutes(total: number): string {
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}
