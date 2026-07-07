import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'

import { apiGet, apiPost } from '@/shared/api/client'

import {
  adaptWatchlistAsset,
  adaptWatchlistSummary,
  adaptWatchlistSummaryTrends,
  type WatchlistAssetRow,
  type WatchlistSummaryTrendsView,
  type WatchlistSummaryView,
} from './adapters'
import type {
  AddWatchlistItemBody,
  AssetDto,
  AssetLookupResponseDto,
  CreateAssetBody,
  WatchlistDto,
  WatchlistItemDto,
  WatchlistSummaryDto,
  WatchlistTrendSeriesDto,
} from './dto'

export const watchlistQueryKey = ['watchlist'] as const

export const emptyWatchlistSummary: WatchlistSummaryView = {
  totalCount: 0,
  riskIncreasingCount: 0,
  recentItems: [],
}

export const emptyWatchlistSummaryTrends: WatchlistSummaryTrendsView = {
  watchlistTotal: [],
  riskIncreasing: [],
}

export function useWatchlistAssets() {
  return useQuery<WatchlistAssetRow[]>({
    queryKey: [...watchlistQueryKey, 'assets'],
    queryFn: async () => {
      const { data: watchlists } = await apiGet<WatchlistDto[]>(
        '/watchlists?page=1&size=20',
      )
      const firstWatchlist = watchlists[0]

      if (!firstWatchlist) return []

      const { data: items } = await apiGet<WatchlistItemDto[]>(
        `/watchlists/${firstWatchlist.id}/items?page=1&size=20&sort=priority&expand=asset`,
      )

      return items
        .map((item) => adaptWatchlistAsset(item))
        .filter((row): row is WatchlistAssetRow => row !== null)
    },
  })
}

export function useWatchlistSummary() {
  return useQuery<WatchlistSummaryView>({
    queryKey: [...watchlistQueryKey, 'summary'],
    queryFn: async () => {
      try {
        const { data: watchlists } = await apiGet<WatchlistDto[]>(
          '/watchlists?page=1&size=20',
        )
        const firstWatchlist = watchlists[0]

        if (!firstWatchlist) return emptyWatchlistSummary

        const { data: summary } = await apiGet<WatchlistSummaryDto>(
          `/watchlists/${firstWatchlist.id}/summary`,
        )

        return adaptWatchlistSummary(summary)
      } catch {
        return emptyWatchlistSummary
      }
    },
  })
}

export function useWatchlistSummaryTrends(): UseQueryResult<WatchlistSummaryTrendsView> {
  return useQuery<WatchlistSummaryTrendsView>({
    queryKey: [...watchlistQueryKey, 'summary', 'trends'],
    queryFn: async () => {
      try {
        const { data: watchlists } = await apiGet<WatchlistDto[]>(
          '/watchlists?page=1&size=20',
        )
        const firstWatchlist = watchlists[0]

        if (!firstWatchlist) return emptyWatchlistSummaryTrends

        const { data: trends } = await apiGet<WatchlistTrendSeriesDto>(
          `/watchlists/${firstWatchlist.id}/summary/trends?days=14`,
        )

        return adaptWatchlistSummaryTrends(trends)
      } catch {
        return emptyWatchlistSummaryTrends
      }
    },
  })
}

export function useAssetSearch(
  symbol: string,
  enabled = true,
): UseQueryResult<AssetDto[]> {
  const trimmedSymbol = symbol.trim()

  return useQuery<AssetDto[]>({
    queryKey: ['assets', 'search', trimmedSymbol],
    enabled: enabled && trimmedSymbol.length > 0,
    queryFn: () => fetchAssetsBySymbol(trimmedSymbol),
  })
}

export async function fetchAssetsBySymbol(symbol: string): Promise<AssetDto[]> {
  const trimmedSymbol = symbol.trim()
  const { data } = await apiGet<AssetDto[]>(
    `/assets?symbol=${encodeURIComponent(trimmedSymbol)}&page=1&size=20`,
  )

  return data
}

export function useAssetLookup(
  query: string,
  market: string | null,
  enabled = true,
): UseQueryResult<AssetLookupResponseDto> {
  const trimmedQuery = query.trim()
  const marketParam = market?.trim() ?? ''
  const lookupParams = new URLSearchParams({ query: trimmedQuery })

  if (marketParam.length > 0) {
    lookupParams.set('market', marketParam)
  }

  return useQuery<AssetLookupResponseDto>({
    queryKey: ['assets', 'lookup', trimmedQuery, marketParam],
    enabled: enabled && trimmedQuery.length > 0,
    queryFn: async () => {
      const { data } = await apiGet<AssetLookupResponseDto>(
        `/assets/lookup?${lookupParams.toString()}`,
      )

      return data
    },
  })
}

export function useCreateAsset(): UseMutationResult<
  AssetDto,
  Error,
  CreateAssetBody
> {
  return useMutation<AssetDto, Error, CreateAssetBody>({
    mutationFn: async (body) => {
      const { data } = await apiPost<AssetDto>('/assets', body)

      return data
    },
  })
}

export function useAddAssetToFirstWatchlist(): UseMutationResult<
  WatchlistItemDto,
  Error,
  AddWatchlistItemBody
> {
  const queryClient = useQueryClient()

  return useMutation<WatchlistItemDto, Error, AddWatchlistItemBody>({
    mutationFn: async (body) => {
      const { data: watchlists } = await apiGet<WatchlistDto[]>(
        '/watchlists?page=1&size=20',
      )
      let firstWatchlist = watchlists[0]

      if (!firstWatchlist) {
        const { data: createdWatchlist } = await apiPost<WatchlistDto>(
          '/watchlists',
          { name: '관심종목' },
        )
        firstWatchlist = createdWatchlist
      }

      const { data } = await apiPost<WatchlistItemDto>(
        `/watchlists/${firstWatchlist.id}/items`,
        body,
      )

      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: watchlistQueryKey })
    },
  })
}
