export const processQualityLabels = {
  evidence_quality: '근거 충분성',
  counter_argument_review: '반대 근거 검토',
  risk_awareness: '위험 인식',
  review_condition_clarity: '재검토 명확성',
  discipline: '규칙 준수',
} as const

export type ProcessQualityCode = keyof typeof processQualityLabels

export const processQualityFields = Object.entries(processQualityLabels).map(
  ([key, label]) => ({ key: key as ProcessQualityCode, label }),
)

export function toProcessQualityLabel(code: string): string {
  return processQualityLabels[code as ProcessQualityCode] ?? code
}
