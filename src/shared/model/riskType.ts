export const riskTypeLabels = {
  VALUATION: '밸류에이션',
  DEMAND_SLOWDOWN: '수요 둔화',
  COMPETITION: '경쟁 심화',
  REGULATION: '규제',
  MARGIN_PRESSURE: '마진 압박',
  SUPPLY_CHAIN: '공급망',
  MACRO_RATE: '금리',
  CURRENCY: '환율',
  CONCENTRATION: '포트폴리오 쏠림',
  LIQUIDITY: '유동성',
  MANAGEMENT: '경영진',
  ACCOUNTING: '회계',
} as const

export type RiskTypeCode = keyof typeof riskTypeLabels
export type RiskType = (typeof riskTypeLabels)[RiskTypeCode]

export const riskTypes = Object.values(riskTypeLabels)

export function toRiskTypeLabel(code: string): string {
  return riskTypeLabels[code as RiskTypeCode] ?? code
}
