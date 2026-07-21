export const riskSeverityLabels = {
  LOW: '낮음',
  MEDIUM: '중간',
  HIGH: '높음',
} as const

export type RiskSeverityCode = keyof typeof riskSeverityLabels
export type RiskSeverity = (typeof riskSeverityLabels)[RiskSeverityCode]

export function toRiskSeverityLabel(code: string): string {
  return riskSeverityLabels[code as RiskSeverityCode] ?? code
}
