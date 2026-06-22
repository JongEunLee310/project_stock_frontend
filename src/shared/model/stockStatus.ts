export const stockStatuses = [
  '안정',
  '관망',
  '관망 유지',
  '위험 증가',
  '추가 리서치 필요',
  '매수 검토 가능',
  '비중 축소 검토',
] as const

export type StockStatus = (typeof stockStatuses)[number]
