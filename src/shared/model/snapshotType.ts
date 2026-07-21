export const snapshotTypeLabels = {
  VALUATION: '밸류에이션',
  NEWS: '뉴스',
  PORTFOLIO: '포트폴리오',
  AI_SIGNAL: 'AI 시그널',
  PRICE: '가격',
} as const

export type SnapshotTypeCode = keyof typeof snapshotTypeLabels
export type SnapshotType = (typeof snapshotTypeLabels)[SnapshotTypeCode]

export function toSnapshotTypeLabel(code: string): string {
  return snapshotTypeLabels[code as SnapshotTypeCode] ?? '기타 데이터'
}
