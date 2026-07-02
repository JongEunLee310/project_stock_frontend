const KST_TIMEZONE = 'Asia/Seoul'

export function formatKstDate(iso: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: KST_TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).format(new Date(iso))
}

export function formatKstDateTime(iso: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: KST_TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function formatKstTime(iso: string): string {
  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: KST_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(iso))

  const hour = parts.find((part) => part.type === 'hour')?.value ?? '00'
  const minute = parts.find((part) => part.type === 'minute')?.value ?? '00'

  return `${hour}:${minute}`
}
