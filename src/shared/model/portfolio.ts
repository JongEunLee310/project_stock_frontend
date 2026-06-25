export interface PositionWeightDto {
  asset_id: number
  quantity: string
  avg_buy_price: string
  cost_value: string
  market_value: string
  cost_weight: string
  weight: string
  exceeds_threshold: boolean
}

export interface SectorWeightDto {
  sector: string
  market_value: string
  weight: string
  exceeds_threshold: boolean
}

export interface PortfolioSummaryDto {
  portfolio_id: number
  concentration_threshold: string
  total_cost_value: string
  total_value: string
  cash_balance: string
  cash_weight: string
  has_sector_concentration: boolean
  positions: PositionWeightDto[]
  sector_weights: SectorWeightDto[]
}

export interface PositionWeight {
  assetId: number
  quantity: number
  avgBuyPrice: number
  costValue: number
  marketValue: number
  costWeight: number
  weight: number
  exceedsThreshold: boolean
}

export interface SectorWeight {
  sector: string
  marketValue: number
  weight: number
  exceedsThreshold: boolean
}

export interface PortfolioSummary {
  portfolioId: number
  concentrationThreshold: number
  totalCostValue: number
  totalValue: number
  cashBalance: number
  cashWeight: number
  hasSectorConcentration: boolean
  positions: PositionWeight[]
  sectorWeights: SectorWeight[]
}
