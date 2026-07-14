const KST_TIMEZONE = 'Asia/Seoul'

function padDateTimePart(value: number): string {
  return String(value).padStart(2, '0')
}

export function formatLocalDateTime(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return value

  return [
    `${date.getFullYear()}-${padDateTimePart(date.getMonth() + 1)}-${padDateTimePart(date.getDate())}`,
    `${padDateTimePart(date.getHours())}:${padDateTimePart(date.getMinutes())}:${padDateTimePart(date.getSeconds())}`,
  ].join(' ')
}

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
