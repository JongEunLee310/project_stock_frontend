export const decisionTypes = [
  '관망 유지',
  '추가 리서치 필요',
  '매수 검토',
  '비중 축소 검토',
  '리스크 증가 검토',
] as const

export type DecisionType = (typeof decisionTypes)[number]
