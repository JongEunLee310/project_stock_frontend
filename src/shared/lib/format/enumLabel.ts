export function toLabel<T extends string>(
  map: Record<string, string>,
  wire: T,
  fallback?: string,
): string {
  return map[wire] ?? fallback ?? wire
}

/** C8 계약: RiskLevel 와이어 영문 → 한글 라벨 */
export const riskLevelLabels: Record<string, string> = {
  HIGH: '높음',
  MEDIUM: '중간',
  LOW: '낮음',
}

/** 계약 §6 인박스 모델: Alert status 와이어 영문 → 한글 라벨 */
export const alertStatusLabels: Record<string, string> = {
  UNREAD: '안읽음',
  READ: '읽음',
  DISMISSED: '무시됨',
}
