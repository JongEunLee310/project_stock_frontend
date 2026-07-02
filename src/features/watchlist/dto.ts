export interface WatchlistDto {
  id: number
  user_id: number
  name: string
  created_at: string
}

export interface WatchlistItemAssetDto {
  symbol: string
  name: string
  price: string | null
  change_percent: string | null
  sector?: string | null
}

export interface WatchlistItemDto {
  id: number
  watchlist_id: number
  asset_id: number
  priority: number
  reason: string | null
  tags: string[]
  memo: string | null
  created_at: string
  asset?: WatchlistItemAssetDto
}

export interface RecentWatchlistItemDto {
  symbol: string
  name: string
  created_at: string
}

export interface WatchlistSummaryDto {
  total_count: number
  risk_increasing_count: number
  recent_items?: RecentWatchlistItemDto[]
}

export interface WatchlistTrendPointDto {
  date: string
  count: number
}

export interface WatchlistTrendSeriesItemDto {
  key: string
  data: WatchlistTrendPointDto[]
}

export interface WatchlistTrendSeriesDto {
  days: number
  series: WatchlistTrendSeriesItemDto[]
}
