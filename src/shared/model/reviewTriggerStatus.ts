export const reviewTriggerStatusLabels = {
  PENDING: '대기 중',
  TRIGGERED: '조건 충족',
  DISMISSED: '해제됨',
} as const

export type ReviewTriggerStatusCode = keyof typeof reviewTriggerStatusLabels
export type ReviewTriggerStatus =
  (typeof reviewTriggerStatusLabels)[ReviewTriggerStatusCode]

export function toReviewTriggerStatusLabel(code: string): string {
  return (
    reviewTriggerStatusLabels[code as ReviewTriggerStatusCode] ?? '알 수 없음'
  )
}
