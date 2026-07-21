import { useQuery } from '@tanstack/react-query'

import { apiGet } from '@/shared/api/client'

import { adaptPortfolioSummary, type PortfolioView } from './adapters'
import type { AssetDto, PortfolioDto, PortfolioSummaryDto } from './dto'

async function fetchAssetOrFallback(assetId: number): Promise<AssetDto> {
  try {
    const { data } = await apiGet<AssetDto>(`/assets/${assetId}`, {
      auth: false,
    })

    return data
  } catch {
    return {
      id: assetId,
      symbol: String(assetId),
      name: String(assetId),
      market: '',
      is_active: true,
      created_at: '',
      sector: 'UNKNOWN',
    }
  }
}

export function usePortfolioSummary() {
  return useQuery<PortfolioView>({
    queryKey: ['portfolio', 'summary'],
    queryFn: async () => {
      const { data: portfolios } = await apiGet<PortfolioDto[]>(
        '/portfolios?page=1&size=20',
      )
      const firstPortfolio = portfolios[0]

      if (!firstPortfolio) {
        return {
          id: '',
          totalValue: 0,
          cash: 0,
          dayChangeValue: 0,
          dayChangePercent: 0,
          holdings: [],
          sectorExposure: [],
          riskExposures: [],
        }
      }

      const { data: summary } = await apiGet<PortfolioSummaryDto>(
        `/portfolios/${firstPortfolio.id}/summary`,
      )
      const assetIds = Array.from(
        new Set(summary.positions.map((position) => position.asset_id)),
      )
      const assets = await Promise.all(assetIds.map(fetchAssetOrFallback))

      return adaptPortfolioSummary(
        summary,
        new Map(assets.map((asset) => [asset.id, asset])),
      )
    },
  })
}
