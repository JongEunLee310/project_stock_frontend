export const riskLevels = ['높음', '중간', '낮음'] as const

export type RiskLevel = (typeof riskLevels)[number]
