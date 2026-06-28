import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { apiGet } from '@/shared/api/client'

import { adaptResearchDetail, type ResearchView } from './adapters'
import type {
  AssetDetailDto,
  AssetLookupDto,
  BuyChecklistDto,
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

export function useAssetIdBySymbol(symbol: string): UseQueryResult<number> {
  return useQuery<number>({
    queryKey: ['assets', 'by-symbol', symbol.trim().toUpperCase()],
    queryFn: () => fetchAssetIdBySymbol(symbol),
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
        apiGet<ThesisDto | null>(`/theses/latest?asset_id=${assetId}`).then(
          (response) => response.data,
        ),
      ])

      // G4 BE 미완 — sparkline 비활성
      const sparkline: number[] = []

      return adaptResearchDetail(
        detail,
        summary,
        checklist,
        reports,
        thesis,
        sparkline,
      )
    },
  })
}
