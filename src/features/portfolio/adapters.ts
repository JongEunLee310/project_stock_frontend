import { parseDecimal } from '@/shared/lib/format'
import type { PortfolioRiskExposure, RiskLevel } from '@/shared/model'

import type { AssetDto, PortfolioSummaryDto } from './dto'

export interface PortfolioHoldingView {
  assetId: number
  symbol: string
  name: string
  sector: string
  quantity: number
  avgPrice: number
  currentValue: number
  weight: number
}

export interface PortfolioSectorExposure {
  name: string
  value: number
  amount: number
}

export interface PortfolioView {
  totalValue: number
  cash: number
  dayChangeValue: number
  dayChangePercent: number
  holdings: PortfolioHoldingView[]
  sectorExposure: PortfolioSectorExposure[]
  riskExposures: PortfolioRiskExposure[]
}

function toRiskLevel(level: string): RiskLevel {
  if (level === 'HIGH') {
    return '높음'
  }

  return '중간'
}

export function adaptPortfolioSummary(
  dto: PortfolioSummaryDto,
  assetsById: ReadonlyMap<number, AssetDto>,
): PortfolioView {
  return {
    totalValue: parseDecimal(dto.total_value) ?? 0,
    cash: parseDecimal(dto.cash_balance) ?? 0,
    dayChangeValue: parseDecimal(dto.day_change_value) ?? 0,
    dayChangePercent: parseDecimal(dto.day_change_percent) ?? 0,
    holdings: dto.positions
      .map((position) => {
        const asset = assetsById.get(position.asset_id)
        const fallback = String(position.asset_id)

        return {
          assetId: position.asset_id,
          symbol: asset?.symbol ?? fallback,
          name: asset?.name ?? fallback,
          sector: asset?.sector ?? 'UNKNOWN',
          quantity: parseDecimal(position.quantity) ?? 0,
          avgPrice: parseDecimal(position.avg_buy_price) ?? 0,
          currentValue: parseDecimal(position.market_value) ?? 0,
          weight: (parseDecimal(position.weight) ?? 0) * 100,
        }
      })
      .sort((first, second) => second.currentValue - first.currentValue),
    sectorExposure: dto.sector_weights
      .map((sector) => ({
        name: sector.sector ?? 'UNKNOWN',
        amount: parseDecimal(sector.market_value) ?? 0,
        value: (parseDecimal(sector.weight) ?? 0) * 100,
      }))
      .sort((first, second) => second.value - first.value),
    riskExposures: (dto.risk_exposures ?? []).map((risk) => ({
      id: risk.code,
      label: risk.label,
      level: toRiskLevel(risk.level),
      description: risk.description,
    })),
  }
}
