import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'

import { apiGet, apiPut } from '@/shared/api/client'
import { ApiError } from '@/shared/api/envelope'

import {
  adaptBenchmarkComparison,
  adaptAssetEvents,
  adaptCatalystTimeline,
  adaptEarningsSummary,
  adaptNewsDisclosure,
  adaptPriceSeries,
  adaptResearchCoverage,
  adaptResearchDetail,
  toResearchQueueView,
  adaptValuationMetrics,
  type BenchmarkSeriesItem,
  type AssetEventItem,
  type CatalystEventItem,
  type EarningsView,
  type NewsDisclosureView,
  type PriceSeriesView,
  type CoverageAxisItem,
  type ResearchQueueView,
  type ResearchView,
  type ValuationView,
} from './adapters'
import type {
  AssetDetailDto,
  AssetEventHistoryDto,
  AssetLookupDto,
  BenchmarkComparisonDto,
  BuyChecklistDto,
  CatalystTimelineDto,
  EarningsSummaryDto,
  NewsDisclosureDto,
  PriceSeriesDto,
  ResearchCoverageDto,
  ResearchQueueResponseDto,
  ResearchSummaryDto,
  ThesisDto,
  ValuationMetricsDto,
} from './dto'

export class SymbolNotFoundError extends Error {
  constructor(symbol: string) {
    super(`${symbol} asset_id를 찾을 수 없습니다`)
    this.name = 'SymbolNotFoundError'
  }
}

export type PriceRange = '1D' | '1M' | '3M' | '6M' | '1Y'
export type BenchmarkRange = Exclude<PriceRange, '1D'>

export interface SaveBuyChecklistBody {
  memo: string | null
  checked_item_keys: string[]
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
  const normalizedSymbol = symbol.trim().toUpperCase()

  return useQuery<number>({
    queryKey: ['asset-id', normalizedSymbol],
    queryFn: () => fetchAssetIdBySymbol(normalizedSymbol),
  })
}

export type ResearchQueueFilter =
  | 'needs_research'
  | 'risk_increasing'
  | 'earnings_upcoming'
  | 'recently_updated'

const researchQueuePageSize = 20

export function useResearchQueue(
  filter: ResearchQueueFilter | undefined,
  page: number,
): UseQueryResult<ResearchQueueView> {
  return useQuery<ResearchQueueView>({
    queryKey: ['research', 'queue', filter, page],
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        page: String(page),
        size: String(researchQueuePageSize),
      })

      if (filter) {
        searchParams.set('filter', filter)
      }

      const { data, meta } = await apiGet<ResearchQueueResponseDto>(
        `/research-queue?${searchParams.toString()}`,
      )

      return toResearchQueueView(
        data,
        meta ?? { page, size: researchQueuePageSize, total: data.items.length },
      )
    },
  })
}

export function useResearchPriceSeries(
  symbol: string | null,
  market: string | null,
  range: PriceRange,
): UseQueryResult<PriceSeriesView> {
  return useQuery<PriceSeriesView>({
    queryKey: ['research', 'price-series', symbol, market, range],
    enabled: Boolean(symbol && market),
    queryFn: async () => {
      if (!symbol || !market) {
        return {
          closes: [],
          points: [],
          currency: null,
          source: null,
          lastUpdatedAt: null,
        }
      }

      const { data } = await apiGet<PriceSeriesDto>(
        `/stocks/${encodeURIComponent(symbol)}/prices?market=${market}&range=${range}`,
      )

      return adaptPriceSeries(data)
    },
  })
}

export function useBenchmarkComparison(
  assetId: number | undefined,
  range: BenchmarkRange,
  enabled: boolean,
): UseQueryResult<BenchmarkSeriesItem[]> {
  return useQuery<BenchmarkSeriesItem[]>({
    queryKey: ['research', 'benchmark', assetId, range],
    enabled: assetId != null && enabled,
    queryFn: async () => {
      if (assetId == null) {
        return []
      }

      const { data } = await apiGet<BenchmarkComparisonDto>(
        `/assets/${assetId}/benchmark-comparison?range=${range}`,
      )

      return adaptBenchmarkComparison(data)
    },
  })
}

export function useAssetEvents(
  assetId: number | null,
  range: BenchmarkRange,
  enabled: boolean,
): UseQueryResult<AssetEventItem[]> {
  return useQuery<AssetEventItem[]>({
    queryKey: ['research', 'asset-events', assetId, range],
    enabled: assetId !== null && enabled,
    queryFn: async () => {
      if (assetId === null) return []

      const { data } = await apiGet<AssetEventHistoryDto>(
        `/assets/${assetId}/events?range=${range}`,
      )

      return adaptAssetEvents(data)
    },
  })
}

export function useValuationMetrics(
  assetId: number | undefined,
  enabled: boolean,
): UseQueryResult<ValuationView> {
  return useQuery<ValuationView>({
    queryKey: ['research', 'valuation', assetId],
    enabled: assetId != null && enabled,
    queryFn: async () => {
      if (assetId == null) {
        return { profileLabel: '', metrics: [] }
      }

      const { data } = await apiGet<ValuationMetricsDto>(
        `/assets/${assetId}/valuation-metrics`,
      )

      return adaptValuationMetrics(data)
    },
  })
}

export function useEarningsSummary(
  assetId: number | undefined,
  enabled: boolean,
): UseQueryResult<EarningsView> {
  return useQuery<EarningsView>({
    queryKey: ['research', 'earnings', assetId],
    enabled: assetId != null && enabled,
    queryFn: async () => {
      if (assetId == null) {
        return { quarters: [], guidance: null, segments: [] }
      }

      const { data } = await apiGet<EarningsSummaryDto>(
        `/assets/${assetId}/earnings-summary`,
      )

      return adaptEarningsSummary(data)
    },
  })
}

export function useNewsDisclosure(
  assetId: number | undefined,
): UseQueryResult<NewsDisclosureView> {
  return useQuery<NewsDisclosureView>({
    queryKey: ['research', 'news-disclosure', assetId],
    enabled: assetId != null,
    queryFn: async () => {
      if (assetId == null) {
        return { news: [], disclosures: [] }
      }

      const { data } = await apiGet<NewsDisclosureDto>(
        `/assets/${assetId}/news-disclosure`,
      )

      return adaptNewsDisclosure(data)
    },
  })
}

export function useCatalystTimeline(
  assetId: number | undefined,
): UseQueryResult<CatalystEventItem[]> {
  return useQuery<CatalystEventItem[]>({
    queryKey: ['research', 'catalysts', assetId],
    enabled: assetId != null,
    queryFn: async () => {
      if (assetId == null) {
        return []
      }

      const { data } = await apiGet<CatalystTimelineDto>(
        `/assets/${assetId}/catalysts`,
      )

      return adaptCatalystTimeline(data)
    },
  })
}

export function useResearchCoverage(
  assetId: number | undefined,
): UseQueryResult<CoverageAxisItem[]> {
  return useQuery<CoverageAxisItem[]>({
    queryKey: ['research', 'coverage', assetId],
    enabled: assetId != null,
    queryFn: async () => {
      if (assetId == null) {
        return []
      }

      const { data } = await apiGet<ResearchCoverageDto>(
        `/assets/${assetId}/research-coverage`,
      )

      return adaptResearchCoverage(data)
    },
  })
}

export function useSaveBuyChecklist(
  assetId: number,
): UseMutationResult<BuyChecklistDto, Error, SaveBuyChecklistBody> {
  const queryClient = useQueryClient()

  return useMutation<BuyChecklistDto, Error, SaveBuyChecklistBody>({
    mutationFn: async (body) => {
      const { data } = await apiPut<BuyChecklistDto>(
        `/assets/${assetId}/buy-checklist`,
        body,
      )

      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['research'] }),
  })
}

export function useResearchView(symbol: string): UseQueryResult<ResearchView> {
  const normalizedSymbol = symbol.trim().toUpperCase()

  return useQuery<ResearchView>({
    queryKey: ['research', normalizedSymbol],
    queryFn: async () => {
      const assetId = await fetchAssetIdBySymbol(normalizedSymbol)
      const [detail, summary, checklist, thesis] = await Promise.all([
        apiGet<AssetDetailDto>(`/assets/${assetId}/detail`).then(
          (response) => response.data,
        ),
        apiGet<ResearchSummaryDto>(`/assets/${assetId}/research-summary`).then(
          (response) => response.data,
        ),
        apiGet<BuyChecklistDto>(`/assets/${assetId}/buy-checklist`).then(
          (response) => response.data,
        ),
        fetchLatestThesis(assetId),
      ])

      return adaptResearchDetail(detail, summary, checklist, thesis)
    },
  })
}
