import type {
  PortfolioSummary,
  PortfolioSummaryDto,
  PositionWeight,
  PositionWeightDto,
  SectorWeight,
  SectorWeightDto,
} from '@/shared/model'
import { parseDecimal } from '@/shared/lib/format'

export function adaptPositionWeight(dto: PositionWeightDto): PositionWeight {
  return {
    assetId: dto.asset_id,
    quantity: parseDecimal(dto.quantity),
    avgBuyPrice: parseDecimal(dto.avg_buy_price),
    costValue: parseDecimal(dto.cost_value),
    marketValue: parseDecimal(dto.market_value),
    costWeight: parseDecimal(dto.cost_weight),
    weight: parseDecimal(dto.weight),
    exceedsThreshold: dto.exceeds_threshold,
  }
}

export function adaptSectorWeight(dto: SectorWeightDto): SectorWeight {
  return {
    sector: dto.sector,
    marketValue: parseDecimal(dto.market_value),
    weight: parseDecimal(dto.weight),
    exceedsThreshold: dto.exceeds_threshold,
  }
}

export function adaptPortfolioSummary(
  dto: PortfolioSummaryDto,
): PortfolioSummary {
  return {
    portfolioId: dto.portfolio_id,
    concentrationThreshold: parseDecimal(dto.concentration_threshold),
    totalCostValue: parseDecimal(dto.total_cost_value),
    totalValue: parseDecimal(dto.total_value),
    cashBalance: parseDecimal(dto.cash_balance),
    cashWeight: parseDecimal(dto.cash_weight),
    hasSectorConcentration: dto.has_sector_concentration,
    positions: dto.positions.map(adaptPositionWeight),
    sectorWeights: dto.sector_weights.map(adaptSectorWeight),
  }
}
