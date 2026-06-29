import { parseDecimal } from '@/shared/lib/format'

import type { WatchlistItemDto, WatchlistSummaryDto } from './dto'

export interface WatchlistAssetRow {
  id: number
  symbol: string
  name: string
  price: number | null
  changePercent: number | null
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
