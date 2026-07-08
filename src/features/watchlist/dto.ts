export interface WatchlistDto {
  id: number
  user_id: number
  name: string
  created_at: string
}

export interface AssetDto {
  id: number
  symbol: string
  name: string
  market: string
  sector: string | null
  is_active: boolean
  created_at: string
}

export interface CreateAssetBody {
  symbol: string
  market: string
}

export interface AssetLookupItemDto {
  symbol: string
  name: string
  market: string
  sector: string | null
  registered: boolean
}

export interface AssetLookupResponseDto {
  items: AssetLookupItemDto[]
}

export interface AddWatchlistItemBody {
  asset_id: number
  priority?: number
  reason?: string | null
  tags?: string[]
  memo?: string | null
}

export interface WatchlistItemAssetDto {
  symbol: string
  market?: string
  name: string
  price: string | null
  change_percent: string | null
  sector?: string | null
  currency?: string | null
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
