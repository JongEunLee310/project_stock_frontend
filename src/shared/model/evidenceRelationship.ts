export const evidenceRelationshipLabels = {
  SUPPORTING: '긍정 근거',
  CONTRADICTING: '반대 근거',
  RISK: '위험',
  BACKGROUND: '배경',
} as const

export type EvidenceRelationshipCode = keyof typeof evidenceRelationshipLabels
export type EvidenceRelationship =
  (typeof evidenceRelationshipLabels)[EvidenceRelationshipCode]

export function toEvidenceRelationshipLabel(code: string): string {
  return evidenceRelationshipLabels[code as EvidenceRelationshipCode] ?? code
}
