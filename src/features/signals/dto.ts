export interface SignalChangeDto {
  direction: string
  score_delta: number | null
  previous_type: string | null
  previous_captured_at: string | null
}

export interface SignalDto {
  id: number
  asset_id: number
  symbol?: string | null
  asset?: {
    symbol?: string | null
    name?: string | null
    market?: string | null
  } | null
  signal_type: string
  score?: string | null
  risk_level: string | null
  reason: string
  key_points?: string[] | null
  change?: SignalChangeDto | null
  evidence?: Record<string, unknown> | string | null
  created_at: string
  expires_at: string | null
}

export type SignalDetailDto = SignalDto

export interface PriceBarDto {
  close?: string | null
}

export interface PriceSeriesDto {
  bars: PriceBarDto[]
}

export interface SignalSummaryDto {
  total: number
  by_category: Record<string, number>
  delta_by_category: Record<string, number>
}

export interface SignalChangeTimelineItemDto {
  asset: {
    symbol?: string | null
    name?: string | null
    market?: string | null
  }
  snapshot_date: string
  captured_at: string
  change: SignalChangeDto
  dominant: {
    signal_id: number | null
    signal_type: string
    score: number
  } | null
}
