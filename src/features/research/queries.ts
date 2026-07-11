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
  adaptCatalystTimeline,
  adaptNewsDisclosure,
  adaptPriceSeries,
  adaptResearchDetail,
  adaptResearchListRow,
  type CatalystEventItem,
  type NewsDisclosureView,
  type PriceSeriesView,
  type ResearchListRow,
  type ResearchView,
} from './adapters'
import type {
  AssetDetailDto,
  AssetLookupDto,
  BuyChecklistDto,
  CatalystTimelineDto,
  NewsDisclosureDto,
  PriceSeriesDto,
  ResearchSummaryDto,
  ThesisDto,
} from './dto'

export class SymbolNotFoundError extends Error {
  constructor(symbol: string) {
    super(`${symbol} asset_id를 찾을 수 없습니다`)
    this.name = 'SymbolNotFoundError'
  }
}

export type PriceRange = '1D' | '1M' | '3M' | '6M' | '1Y'

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
  return useQuery<number>({
    queryKey: ['assets', 'by-symbol', symbol.trim().toUpperCase()],
    queryFn: () => fetchAssetIdBySymbol(symbol),
  })
}

export function useResearchList(): UseQueryResult<ResearchListRow[]> {
  return useQuery<ResearchListRow[]>({
    queryKey: ['research', 'list'],
    queryFn: async () => {
      const { data: assets } = await apiGet<AssetLookupDto[]>(
        '/assets?page=1&size=100',
      )

      return Promise.all(
        assets.map(async (asset) => {
          try {
            const { data: summary } = await apiGet<ResearchSummaryDto>(
              `/assets/${asset.id}/research-summary`,
            )

            return adaptResearchListRow(asset, summary)
          } catch {
            return adaptResearchListRow(asset, null)
          }
        }),
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
