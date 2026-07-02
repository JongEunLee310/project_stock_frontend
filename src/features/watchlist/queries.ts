import { useQuery } from '@tanstack/react-query'
import type { UseQueryResult } from '@tanstack/react-query'

import { apiGet } from '@/shared/api/client'

import {
  adaptWatchlistAsset,
  adaptWatchlistSummary,
  adaptWatchlistSummaryTrends,
  type WatchlistAssetRow,
  type WatchlistSummaryTrendsView,
  type WatchlistSummaryView,
} from './adapters'
import type {
  WatchlistDto,
  WatchlistItemDto,
  WatchlistSummaryDto,
  WatchlistTrendSeriesDto,
} from './dto'

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
    queryKey: ['watchlist', 'assets'],
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
    queryKey: ['watchlist', 'summary'],
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
    queryKey: ['watchlist', 'summary', 'trends'],
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
