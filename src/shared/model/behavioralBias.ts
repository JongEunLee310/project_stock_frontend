export const behavioralBiasLabels = {
  FOMO: '기회 상실 불안',
} as const

export type BehavioralBiasCode = keyof typeof behavioralBiasLabels
export type BehavioralBias = (typeof behavioralBiasLabels)[BehavioralBiasCode]

export function toBehavioralBiasLabel(code: string): string {
  return behavioralBiasLabels[code as BehavioralBiasCode] ?? code
}
