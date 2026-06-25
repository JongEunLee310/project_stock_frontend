import { parseDecimal } from '@/shared/lib/format/decimal'

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
  quantity: string
  avg_buy_price: string
  cost_value: string
  market_value: string
  cost_weight: string
  weight: string
  exceeds_threshold: boolean
}

export interface PortfolioSectorWeightDto {
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
  positions: PortfolioPositionDto[]
  sector_weights: PortfolioSectorWeightDto[]
}

export interface PortfolioHolding {
  assetId: number
  symbol: string
  quantity: number
  avgPrice: number
  costValue: number
  currentValue: number
  weight: number
}

export interface PortfolioSectorWeight {
  name: string
  value: number
  amount: number
  exceedsThreshold: boolean
}

export interface PortfolioSummary {
  totalValue: number
  cash: number
  cashRatio: number
  hasSectorConcentration: boolean
  holdings: PortfolioHolding[]
  sectorWeights: PortfolioSectorWeight[]
}

function decimalOrZero(value: string | null | undefined) {
  return parseDecimal(value) ?? 0
}

export function adaptPortfolios(dtos: PortfolioDto[]) {
  return dtos.map((dto) => ({
    id: dto.id,
    name: dto.name,
    createdAt: dto.created_at,
  }))
}

export function adaptPortfolioSummary(
  dto: PortfolioSummaryDto,
): PortfolioSummary {
  return {
    totalValue: decimalOrZero(dto.total_value),
    cash: decimalOrZero(dto.cash_balance),
    cashRatio: decimalOrZero(dto.cash_weight) * 100,
    hasSectorConcentration: dto.has_sector_concentration,
    holdings: dto.positions.map((position) => ({
      assetId: position.asset_id,
      // TODO #48: position별 symbol API 미구현. BE asset_id를 표시용 식별자로 사용한다.
      symbol: String(position.asset_id),
      quantity: decimalOrZero(position.quantity),
      avgPrice: decimalOrZero(position.avg_buy_price),
      costValue: decimalOrZero(position.cost_value),
      currentValue: decimalOrZero(position.market_value),
      weight: decimalOrZero(position.weight) * 100,
    })),
    sectorWeights: dto.sector_weights.map((sector) => ({
      name: sector.sector,
      amount: decimalOrZero(sector.market_value),
      value: decimalOrZero(sector.weight) * 100,
      exceedsThreshold: sector.exceeds_threshold,
    })),
  }
}
