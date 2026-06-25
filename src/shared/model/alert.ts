export enum AlertStatus {
  Unread = 'UNREAD',
  Read = 'READ',
  Dismissed = 'DISMISSED',
}

export enum AlertCandidateType {
  NewsSurge = 'NEWS_SURGE',
  PriceMovement = 'PRICE_MOVEMENT',
  Disclosure = 'DISCLOSURE',
  PortfolioConcentration = 'PORTFOLIO_CONCENTRATION',
  BuyChecklistRequired = 'BUY_CHECKLIST_REQUIRED',
}

export enum AlertImportance {
  Low = 'LOW',
  Medium = 'MEDIUM',
  High = 'HIGH',
}

export enum AlertCandidateStatus {
  Unread = 'UNREAD',
  Read = 'READ',
  Confirmed = 'CONFIRMED',
}

export const ALERT_STATUS_LABELS = {
  [AlertStatus.Unread]: '읽지 않음',
  [AlertStatus.Read]: '읽음',
  [AlertStatus.Dismissed]: '무시됨',
} satisfies Record<AlertStatus, string>

export const ALERT_CANDIDATE_TYPE_LABELS = {
  [AlertCandidateType.NewsSurge]: '뉴스 급증',
  [AlertCandidateType.PriceMovement]: '가격 변동',
  [AlertCandidateType.Disclosure]: '공시',
  [AlertCandidateType.PortfolioConcentration]: '포트폴리오 집중',
  [AlertCandidateType.BuyChecklistRequired]: '매수 체크리스트 필요',
} satisfies Record<AlertCandidateType, string>

export const ALERT_IMPORTANCE_LABELS = {
  [AlertImportance.High]: '높음',
  [AlertImportance.Medium]: '중간',
  [AlertImportance.Low]: '낮음',
} satisfies Record<AlertImportance, string>

export interface AlertDto {
  id: number
  user_id: number
  signal_id: number
  status: AlertStatus
  created_at: string
}

export interface Alert {
  id: number
  userId: number
  signalId: number
  status: AlertStatus
  createdAt: string
}

export interface AlertCandidateDto {
  id: number
  user_id: number
  candidate_type: AlertCandidateType
  importance: AlertImportance
  status: AlertCandidateStatus
  title: string
  message: string | null
  asset_id: number | null
  evidence: Record<string, unknown> | null
  created_at: string
}

export interface AlertCandidate {
  id: number
  userId: number
  candidateType: AlertCandidateType
  importance: AlertImportance
  status: AlertCandidateStatus
  title: string
  message: string | null
  assetId: number | null
  evidence: Record<string, unknown> | null
  createdAt: string
}
