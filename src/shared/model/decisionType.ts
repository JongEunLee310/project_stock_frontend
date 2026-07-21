export const decisionTypeLabels = {
  WATCH: '관찰 지속',
  RESEARCH_REQUIRED: '추가 리서치 필요',
  HOLD: '관망 유지',
  BUY_REVIEW: '매수 검토',
  SELL_REVIEW: '매도 검토',
  REDUCE_REVIEW: '비중 축소 검토',
  REBALANCE_REVIEW: '리밸런싱 검토',
  THESIS_INVALIDATED: '투자 가설 훼손',
  NO_ACTION: '행동하지 않음',
} as const

export type DecisionTypeCode = keyof typeof decisionTypeLabels
export type DecisionType = (typeof decisionTypeLabels)[DecisionTypeCode]

export const decisionTypes = Object.values(decisionTypeLabels)

export const decisionTypeCodeByLabel = Object.fromEntries(
  Object.entries(decisionTypeLabels).map(([code, label]) => [label, code]),
) as Record<DecisionType, DecisionTypeCode>

export function toDecisionTypeLabel(code: string): string {
  return decisionTypeLabels[code as DecisionTypeCode] ?? code
}
