export const targetTypeLabels = {
  SYMBOL: '종목',
  PORTFOLIO: '포트폴리오',
  TOPIC: '토픽',
  SECTOR: '섹터',
  MARKET: '시장',
} as const

export type TargetTypeCode = keyof typeof targetTypeLabels
export type TargetType = (typeof targetTypeLabels)[TargetTypeCode]

export function toTargetTypeLabel(code: string): string {
  return targetTypeLabels[code as TargetTypeCode] ?? code
}
