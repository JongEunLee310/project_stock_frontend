import type { PriceSeriesDto } from '@/features/signals/dto'

export interface AssetDto {
  id: number
  symbol: string
  name: string
  market: string
  is_active: boolean
  created_at: string
}

export interface AssetDetailDto {
  id: number
  symbol: string
  name: string
  market: string
  price: string | null
  previous_close: string | null
  change: string | null
  change_percent: string | null
  currency: string
  sector: string | null
  industry: string | null
  description: string | null
  as_of: string
  per: string | null
  peg: string | null
  fifty_two_week_low: string | null
  fifty_two_week_high: string | null
  target_price: string | null
  target_upside_percent: string | null
}

export interface ResearchSummaryDto {
  asset_id: number
  positive_factors: string[]
  negative_factors: string[]
  items_to_verify: string[]
  sources: Array<{ type: string; label: string; url: string | null }>
  updated_at: string
}

export interface BuyChecklistDto {
  asset_id: number
  items: Array<{
    key: string
    label: string
    status: string
    detail: string
  }>
  memo: string | null
  checked_item_keys: string[]
  is_complete: boolean
  decided_at: string | null
}

export interface ResearchReportDto {
  id: number
  asset_id: number
  thesis_id: number | null
  summary: string
  positive_factors: string[]
  negative_factors: string[]
  risk_level: string
  thesis_conflict_status: string
  conflict_reason: string | null
  news_item_ids: number[]
  created_at: string
}

export interface ThesisDto {
  id: number
  user_id: number
  asset_id: number
  summary: string
  risk_factors: string | null
  invalidation_conditions: string | null
  is_active: boolean
  created_at: string
}

export type { PriceSeriesDto }
