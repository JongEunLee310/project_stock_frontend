export const reviewTriggerTypeLabels = {
  DATE: '날짜',
  PRICE: '가격',
  METRIC: '지표',
  EVENT: '이벤트',
  SIGNAL_CHANGE: '시그널 변화',
  MANUAL: '수동',
} as const

export type ReviewTriggerTypeCode = keyof typeof reviewTriggerTypeLabels
export type ReviewTriggerType =
  (typeof reviewTriggerTypeLabels)[ReviewTriggerTypeCode]

export function toReviewTriggerTypeLabel(code: string): string {
  return reviewTriggerTypeLabels[code as ReviewTriggerTypeCode] ?? code
}
