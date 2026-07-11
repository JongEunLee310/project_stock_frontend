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
  stance_comment?: string | null
  headline?: string | null
  body?: string | null
  positive_factors?: string[] | null
  caution_factors?: string[] | null
  next_checks?: string[] | null
  confidence_basis?: string | null
  counter_view?: string[] | null
  key_risks?: Array<{
    id?: string | number
    title: string
    level: string
    description: string
    evidence?: string[] | null
  }> | null
  created_at: string
}

export interface ResearchCoverageDto {
  asset_id: number
  axes: Array<{
    axis: string
    status: 'COLLECTED' | 'NOT_COLLECTED'
    last_updated_at: string | null
    item_count: number
  }>
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

export interface NewsDisclosureDto {
  asset_id: number
  news: Array<{
    id: number
    title: string
    url: string
    source: string
    published_at?: string | null
    summary?: string | null
    category?: string | null
    impact_level?: string | null
    sentiment?: string | null
  }>
  disclosures: Array<{
    title: string
    url: string
    source: string
    published_at?: string | null
    summary?: string | null
    category?: string | null
    impact_level?: string | null
    sentiment?: string | null
  }>
}

export interface CatalystTimelineDto {
  asset_id: number
  events: Array<{
    event_date: string
    title: string
    event_type: string
    is_estimated: boolean
  }>
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
