export interface AssetBriefDto {
  symbol: string
  name: string
  price: string
  change_percent: string
  sector?: string | null
}

export interface AssetBrief {
  symbol: string
  name: string
  price: number
  changePercent: number
  sector: string | null
}

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
  price: string
  previous_close: string
  change: string
  change_percent: string
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

export interface StockViewModel {
  assetId: number
  symbol: string
  name: string
  market: string
  price: number
  previousClose: number
  change: number
  changePercent: number
  currency: string
  sector: string | null
  industry: string | null
  description: string | null
  per: number | null
  peg: number | null
  fiftyTwoWeekLow: number | null
  fiftyTwoWeekHigh: number | null
  targetPrice: number | null
  targetUpsidePercent: number | null
  asOf: string
}
