import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { apiGet } from '@/shared/api/client'
import { ApiError } from '@/shared/api/envelope'
import { parseDecimal } from '@/shared/lib/format'

import { adaptResearchDetail, type ResearchView } from './adapters'
import type {
  AssetDetailDto,
  AssetLookupDto,
  BuyChecklistDto,
  PriceSeriesDto,
  ReportDto,
  ResearchSummaryDto,
  ThesisDto,
} from './dto'

export class SymbolNotFoundError extends Error {
  constructor(symbol: string) {
    super(`${symbol} asset_id를 찾을 수 없습니다`)
    this.name = 'SymbolNotFoundError'
  }
}

async function fetchAssetIdBySymbol(symbol: string) {
  const normalizedSymbol = symbol.trim().toUpperCase()
  const { data } = await apiGet<AssetLookupDto[]>(
    `/assets?symbol=${encodeURIComponent(normalizedSymbol)}`,
  )
  const asset = data.find((item) => item.symbol === normalizedSymbol) ?? data[0]

  if (!asset) {
    throw new SymbolNotFoundError(normalizedSymbol)
  }

  return asset.id
}

async function fetchLatestThesis(assetId: number): Promise<ThesisDto | null> {
  try {
    const { data } = await apiGet<ThesisDto | null>(
      `/theses/latest?asset_id=${assetId}`,
    )
    return data
  } catch (error) {
    if (error instanceof ApiError && error.code === 'THESIS_NOT_FOUND') {
      return null
    }

    throw error
  }
}

export function useAssetIdBySymbol(symbol: string): UseQueryResult<number> {
  return useQuery<number>({
    queryKey: ['assets', 'by-symbol', symbol.trim().toUpperCase()],
    queryFn: () => fetchAssetIdBySymbol(symbol),
  })
}

export function useResearchPriceSeries(
  symbol: string | null,
  market: string | null,
): UseQueryResult<number[]> {
  return useQuery<number[]>({
    queryKey: ['research', 'price-series', symbol, market],
    enabled: Boolean(symbol && market),
    queryFn: async () => {
      if (!symbol || !market) return []

      const { data } = await apiGet<PriceSeriesDto>(
        `/stocks/${encodeURIComponent(symbol)}/prices?market=${market}&range=3M&interval=1d`,
      )

      return data.bars
        .map((bar) => parseDecimal(bar.close))
        .filter((close): close is number => close !== null)
    },
  })
}

export function useResearchView(symbol: string): UseQueryResult<ResearchView> {
  const normalizedSymbol = symbol.trim().toUpperCase()

  return useQuery<ResearchView>({
    queryKey: ['research', normalizedSymbol],
    queryFn: async () => {
      const assetId = await fetchAssetIdBySymbol(normalizedSymbol)
      const [detail, summary, checklist, reports, thesis] = await Promise.all([
        apiGet<AssetDetailDto>(`/assets/${assetId}/detail`).then(
          (response) => response.data,
        ),
        apiGet<ResearchSummaryDto>(`/assets/${assetId}/research-summary`).then(
          (response) => response.data,
        ),
        apiGet<BuyChecklistDto>(`/assets/${assetId}/buy-checklist`).then(
          (response) => response.data,
        ),
        apiGet<ReportDto[]>(`/reports?asset_id=${assetId}`).then(
          (response) => response.data,
        ),
        fetchLatestThesis(assetId),
      ])

      return adaptResearchDetail(detail, summary, checklist, reports, thesis)
    },
  })
}
