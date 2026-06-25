export type SignalTypeDto =
  | 'RISK_ALERT'
  | 'THESIS_CONFLICT'
  | 'BUY_CHECKLIST_REQUIRED'
  | 'NEWS_SURGE'
  | 'PRICE_MOVEMENT'
  | string

export type RiskLevelDto = 'HIGH' | 'MEDIUM' | 'LOW' | string

export interface SignalDto {
  id: number
  asset_id: number
  thesis_id: number | null
  news_item_id: number | null
  signal_type: SignalTypeDto
  score: number
  risk_level: RiskLevelDto
  reason: string
  evidence: Record<string, unknown> | null
  expires_at: string | null
  is_expired: boolean
  created_at: string
}

export interface PriceBarDto {
  date: string
  open: string
  high: string
  low: string
  close: string
  adjusted_close: string
  volume: number
}

export interface PriceSeriesDto {
  symbol: string
  market: string
  currency: string
  interval: string
  range: string
  source: string
  last_updated_at: string
  bars: PriceBarDto[]
}
