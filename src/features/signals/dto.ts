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
  risk_level: string
  reason: string
  evidence?: string | null
  created_at: string
  expires_at: string
}

export type SignalDetailDto = SignalDto

export interface PriceBarDto {
  close?: string | null
}
