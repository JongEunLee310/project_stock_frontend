const KST_TIMEZONE = 'Asia/Seoul'
const millisecondsPerMinute = 60 * 1000
const minutesPerHour = 60
const hoursPerDay = 24

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

export function formatRelativeTime(
  updatedAtMs: number,
  now = Date.now(),
): string {
  if (!Number.isFinite(updatedAtMs) || !Number.isFinite(now)) {
    return '알 수 없음'
  }

  const elapsedMinutes = Math.floor(
    Math.max(0, now - updatedAtMs) / millisecondsPerMinute,
  )

  if (elapsedMinutes < 1) return '방금 전'
  if (elapsedMinutes < minutesPerHour) return `${elapsedMinutes}분 전`

  const elapsedHours = Math.floor(elapsedMinutes / minutesPerHour)
  if (elapsedHours < hoursPerDay) return `${elapsedHours}시간 전`

  return `${Math.floor(elapsedHours / hoursPerDay)}일 전`
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

export function formatKstDateTimeCompact(iso: string): string {
  const date = new Date(iso)

  if (Number.isNaN(date.getTime())) return iso

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: KST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ''

  return `${getPart('year')}-${getPart('month')}-${getPart('day')} ${getPart('hour')}:${getPart('minute')}`
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
