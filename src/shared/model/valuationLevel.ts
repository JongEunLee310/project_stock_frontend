export const valuationLevels = ['저평가', '적정', '고평가'] as const

export type ValuationLevel = (typeof valuationLevels)[number]
