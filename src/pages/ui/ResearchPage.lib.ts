import { formatKstDateTimeCompact } from '@/shared/lib/format'

const ISO_DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2}T/

export function formatResearchChartTooltipLabel(label: unknown): string {
  if (typeof label !== 'string' || !ISO_DATETIME_PATTERN.test(label)) {
    return String(label)
  }

  return formatKstDateTimeCompact(label)
}
