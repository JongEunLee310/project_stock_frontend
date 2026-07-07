import { parseDecimal } from '@/shared/lib/format'

import type {
  WatchlistItemDto,
  WatchlistSummaryDto,
  WatchlistTrendSeriesDto,
} from './dto'

export interface WatchlistAssetRow {
  id: number
  symbol: string
  name: string
  price: number | null
  changePercent: number | null
  currency: string | null
  sector: string
  reason: string | null
  tags: string[]
  memo: string | null
  createdAt: string
  isFavorite: boolean
}

export interface RecentWatchlistView {
  symbol: string
  name: string
  addedAt: string
}

export interface WatchlistSummaryView {
  totalCount: number
  riskIncreasingCount: number
  recentItems: RecentWatchlistView[]
}

export interface WatchlistSummaryTrendsView {
  watchlistTotal: number[]
  riskIncreasing: number[]
}

export function adaptWatchlistAsset(
  item: WatchlistItemDto,
): WatchlistAssetRow | null {
  if (!item.asset) return null

  return {
    id: item.id,
    symbol: item.asset.symbol,
    name: item.asset.name,
    price: parseDecimal(item.asset.price),
    changePercent: parseDecimal(item.asset.change_percent),
    currency: item.asset.currency ?? null,
    sector: item.asset.sector ?? 'UNKNOWN',
    reason: item.reason,
    tags: item.tags,
    memo: item.memo,
    createdAt: item.created_at,
    isFavorite: true,
  }
}

export function adaptWatchlistSummary(
  dto: WatchlistSummaryDto,
): WatchlistSummaryView {
  return {
    totalCount: dto.total_count,
    riskIncreasingCount: dto.risk_increasing_count,
    recentItems: (dto.recent_items ?? []).map((item) => ({
      symbol: item.symbol,
      name: item.name,
      addedAt: item.created_at,
    })),
  }
}

export function getWatchlistTrendCounts(
  dto: WatchlistTrendSeriesDto,
  key: string,
): number[] {
  return (
    dto.series
      .find((item) => item.key === key)
      ?.data.map((point) => point.count) ?? []
  )
}

export function adaptWatchlistSummaryTrends(
  dto: WatchlistTrendSeriesDto,
): WatchlistSummaryTrendsView {
  return {
    watchlistTotal: getWatchlistTrendCounts(dto, 'watchlist_total'),
    riskIncreasing: getWatchlistTrendCounts(dto, 'risk_increasing'),
  }
}
