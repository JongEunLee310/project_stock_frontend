export const cognitiveRisks = [
  '밸류에이션',
  '마진 압박',
  '경쟁 심화',
  '수요 둔화',
  '규제',
  '거시·금리',
  '환율',
  '공급망',
  '기타',
] as const

export type CognitiveRisk = (typeof cognitiveRisks)[number]
