export interface PortfolioDto {
  id: number
  user_id: number
  name: string
  concentration_threshold: string
  cash_balance: string
  created_at: string
}

export interface PortfolioPositionDto {
  asset_id: number
  quantity: string | null
  avg_buy_price: string | null
  cost_value: string | null
  market_value: string | null
  cost_weight: string | null
  weight: string | null
  exceeds_threshold: boolean
}

export interface PortfolioSectorWeightDto {
  sector: string | null
  market_value: string | null
  weight: string | null
  exceeds_threshold: boolean
}

export interface PortfolioSummaryDto {
  portfolio_id: number
  concentration_threshold: string | null
  total_cost_value: string | null
  total_value: string | null
  cash_balance: string | null
  cash_weight: string | null
  day_change_value: string | null
  day_change_percent: string | null
  has_sector_concentration: boolean
  positions: PortfolioPositionDto[]
  sector_weights: PortfolioSectorWeightDto[]
}

export interface AssetDto {
  id: number
  symbol: string
  name: string
  market: string
  is_active: boolean
  created_at: string
  sector?: string | null
}
