export const decisionStatusLabels = {
  DRAFT: '초안',
  ACTIVE: '진행 중',
  REVIEW_DUE: '재검토 예정',
  REVIEWED: '복기됨',
  CLOSED: '종료',
  CANCELLED: '취소',
} as const

export type DecisionStatusCode = keyof typeof decisionStatusLabels
export type DecisionStatus = (typeof decisionStatusLabels)[DecisionStatusCode]

export function toDecisionStatusLabel(code: string): string {
  return decisionStatusLabels[code as DecisionStatusCode] ?? code
}
