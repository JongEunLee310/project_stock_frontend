export const decisionTypes = [
  '매수',
  '비중 확대',
  '관망',
  '비중 축소',
  '매도',
  '보류',
] as const

export type DecisionType = (typeof decisionTypes)[number]
