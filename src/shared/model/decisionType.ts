export const decisionTypeLabels = {
  WATCH: '관망',
  BUY_CONSIDER: '매수 검토',
  BUY: '매수',
  HOLD: '보유 유지',
  SELL_CONSIDER: '매도 검토',
  SELL: '매도',
  SKIP: '보류',
  REBALANCE: '리밸런싱',
  TAKE_PROFIT: '차익 실현',
  STOP_LOSS: '손절',
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
