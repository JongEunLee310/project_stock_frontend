import type { AssetBrief, AssetBriefDto } from './stock'

export enum SignalType {
  Watch = 'WATCH',
  RiskAlert = 'RISK_ALERT',
  ThesisBroken = 'THESIS_BROKEN',
  BuyCandidate = 'BUY_CANDIDATE',
  SellReview = 'SELL_REVIEW',
  Overheated = 'OVERHEATED',
}

export const SIGNAL_TYPE_LABELS = {
  [SignalType.Watch]: '관망',
  [SignalType.RiskAlert]: '위험 경보',
  [SignalType.ThesisBroken]: '가설 붕괴',
  [SignalType.BuyCandidate]: '매수 후보',
  [SignalType.SellReview]: '매도 검토',
  [SignalType.Overheated]: '과열',
} satisfies Record<SignalType, string>

export const RISK_LEVEL_LABELS: Readonly<Record<string, string>> = {
  HIGH: '높음',
  MEDIUM: '중간',
  LOW: '낮음',
}

export interface SignalDto {
  id: number
  asset_id: number
  symbol?: string | null
  signal_type: SignalType
  score: string | number
  risk_level: string | null
  reason: string
  evidence: Record<string, unknown> | null
  created_at: string
  expires_at: string | null
  is_expired: boolean
  asset?: AssetBriefDto | null
}

export interface Signal {
  id: number
  assetId: number
  symbol: string
  signalType: SignalType
  score: number
  riskLevel: string | null
  reason: string
  evidence: Record<string, unknown> | null
  createdAt: string
  expiresAt: string | null
  isExpired: boolean
  asset?: AssetBrief | null
}

export function getRiskLevelLabel(riskLevel: string | null): string {
  if (riskLevel === null) {
    return '-'
  }

  return RISK_LEVEL_LABELS[riskLevel] ?? riskLevel
}

export function getSignalDisplaySymbol(
  signal: Pick<Signal, 'asset' | 'assetId' | 'symbol'>,
  assetSymbolsById: ReadonlyMap<number, string> = new Map(),
): string {
  if (signal.asset?.symbol) {
    return signal.asset.symbol
  }

  const resolvedSymbol = assetSymbolsById.get(signal.assetId)

  if (resolvedSymbol) {
    return resolvedSymbol
  }

  if (signal.symbol) {
    return signal.symbol
  }

  return signal.assetId > 0 ? String(signal.assetId) : '-'
}
