import { useQuery } from '@tanstack/react-query'

import { apiGet } from '@/shared/api/client'

import { adaptResearch, type ResearchView } from './adapters'
import type {
  AssetDetailDto,
  AssetDto,
  BuyChecklistDto,
  PriceSeriesDto,
  ResearchReportDto,
  ResearchSummaryDto,
  ThesisDto,
} from './dto'

export function useResearch(symbol: string) {
  return useQuery<ResearchView>({
    queryKey: ['research', symbol],
    queryFn: async () => {
      const { data: assets } = await apiGet<AssetDto[]>(
        `/assets?symbol=${encodeURIComponent(symbol)}&page=1&size=1`,
        { auth: false },
      )
      const asset = assets[0]
      if (!asset) throw new Error(`${symbol} 자산을 찾을 수 없습니다.`)

      const [detail, summary, checklist, reports, thesis, prices] =
        await Promise.all([
          apiGet<AssetDetailDto>(`/assets/${asset.id}/detail`, { auth: false }),
          apiGet<ResearchSummaryDto>(`/assets/${asset.id}/research-summary`),
          apiGet<BuyChecklistDto>(`/assets/${asset.id}/buy-checklist`),
          apiGet<ResearchReportDto[]>(
            `/reports?asset_id=${asset.id}&page=1&size=20`,
          ),
          apiGet<ThesisDto>(`/theses/latest?asset_id=${asset.id}`).catch(
            () => ({ data: null, meta: undefined }),
          ),
          apiGet<PriceSeriesDto>(
            `/stocks/${encodeURIComponent(asset.symbol)}/prices?market=${encodeURIComponent(
              asset.market,
            )}&range=3M&interval=1d&adjusted=true`,
            { auth: false },
          ).catch(() => ({ data: null, meta: undefined })),
        ])

      return adaptResearch(
        asset,
        detail.data,
        summary.data,
        checklist.data,
        reports.data,
        thesis.data,
        prices.data,
      )
    },
  })
}
