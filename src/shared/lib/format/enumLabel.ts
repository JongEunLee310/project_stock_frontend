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

/** BE 051 Alert signal type 와이어 영문 → 한글 라벨 */
export const alertTypeLabels: Record<string, string> = {
  WATCH: '관찰',
  RISK_ALERT: '위험 경보',
  THESIS_BROKEN: '논거 훼손',
  BUY_CANDIDATE: '매수 후보',
  SELL_REVIEW: '매도 검토',
  OVERHEATED: '과열',
}

/** BE research-summary stance 와이어 영문 → 한글 라벨 */
export const researchStanceLabels: Record<string, string> = {
  BUY_CANDIDATE: '매수 후보',
  WATCH: '관찰',
}
