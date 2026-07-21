import { toLabel } from '@/shared/lib/format'

export const outcomeStatusLabels = {
  THESIS_CONFIRMED: '가설 확인',
  THESIS_PARTIALLY_CONFIRMED: '가설 일부 확인',
  THESIS_INVALIDATED: '가설 무효화',
  INSUFFICIENT_TIME: '판단 유보',
  CLOSED: '종료',
} as const

export type OutcomeStatusCode = keyof typeof outcomeStatusLabels

export type OutcomeStatus = {
  value: OutcomeStatusCode
  label: (typeof outcomeStatusLabels)[OutcomeStatusCode]
}

export const outcomeStatuses = Object.entries(outcomeStatusLabels).map(
  ([value, label]) => ({ value: value as OutcomeStatusCode, label }),
) satisfies OutcomeStatus[]

export function toOutcomeStatusLabel(value: string): string {
  return toLabel(outcomeStatusLabels, value, '알 수 없음')
}
