export const confidenceLevelLabels = {
  LOW: '낮음',
  MEDIUM: '중간',
  HIGH: '높음',
} as const

export type ConfidenceLevelCode = keyof typeof confidenceLevelLabels
export type ConfidenceLevel =
  (typeof confidenceLevelLabels)[ConfidenceLevelCode]

export function toConfidenceLevelLabel(code: string): string {
  return confidenceLevelLabels[code as ConfidenceLevelCode] ?? code
}
