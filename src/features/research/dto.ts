export interface AssetLookupDto {
  id: number
  symbol: string
  name: string
  market?: string | null
  sector?: string | null
}

export interface AssetDetailDto extends AssetLookupDto {
  price?: string | null
  previous_close?: string | null
  change?: string | null
  change_percent?: string | null
  currency?: string | null
  market_cap?: string | null
  per?: string | null
  peg?: string | null
  fifty_two_week_low?: string | null
  fifty_two_week_high?: string | null
  target_price?: string | null
  target_upside_percent?: string | null
  next_earnings_date?: string | null
  updated_at?: string | null
}

export interface ResearchSummaryDto {
  stance?: string | null
  stance_confidence?: string | null
  headline?: string | null
  body?: string | null
  key_risks?: Array<{
    id?: string | number
    title: string
    level: string
    description: string
  }> | null
  created_at: string
}

export interface BuyChecklistDto {
  memo?: string | null
  checked_item_keys?: string[] | null
  items?: Array<{
    id?: string | number
    label: string
    description?: string | null
    checked?: boolean | null
  }> | null
}

export interface ReportDto {
  id: number
  title: string
  source?: string | null
  summary?: string | null
  created_at: string
}

export interface ThesisDto {
  id: number
  title: string
  summary?: string | null
  created_at: string
}

export interface PriceBarDto {
  close?: string | null
}

export interface PriceSeriesDto {
  currency?: string | null
  source?: string | null
  last_updated_at?: string | null
  bars: PriceBarDto[]
}
