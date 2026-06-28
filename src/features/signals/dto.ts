export interface SignalDto {
  id: number
  asset_id: number
  symbol?: string | null
  asset?: {
    symbol?: string | null
    name?: string | null
  } | null
  signal_type: string
  score?: string | null
  risk_level: string | null
  reason: string
  evidence?: Record<string, unknown> | string | null
  created_at: string
  expires_at: string | null
}

export type SignalDetailDto = SignalDto

export interface PriceBarDto {
  close?: string | null
}
