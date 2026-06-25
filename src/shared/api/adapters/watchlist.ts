import type { ApiMeta } from '@/shared/api/envelope'
import type { WatchlistSummaryCard } from '@/shared/model'
import { parseDecimal } from '@/shared/lib/format/decimal'

export interface WatchlistDto {
  id: number
  user_id: number
  name: string
  created_at: string
}

export interface WatchlistAssetDto {
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
  asset?: WatchlistAssetDto
}

export interface WatchlistStock {
  symbol: string
  name: string
  price: number | null
  changePercent: number | null
  lastUpdatedAt: string
  isFavorite: boolean
}

export interface WatchlistItemsResult {
  stocks: WatchlistStock[]
  summaryCards: WatchlistSummaryCard[]
  meta?: ApiMeta
}

export function adaptWatchlists(dtos: WatchlistDto[]) {
  return dtos.map((dto) => ({
    id: dto.id,
    name: dto.name,
    createdAt: dto.created_at,
  }))
}

export function adaptWatchlistItems(
  dtos: WatchlistItemDto[],
  meta?: ApiMeta,
): WatchlistItemsResult {
  const stocks = dtos
    .filter((dto) => dto.asset)
    .map((dto) => ({
      symbol: dto.asset!.symbol,
      name: dto.asset!.name,
      price: parseDecimal(dto.asset!.price),
      changePercent: parseDecimal(dto.asset!.change_percent),
      lastUpdatedAt: dto.created_at,
      isFavorite: true,
    }))

  const total = meta?.total ?? stocks.length

  return {
    stocks,
    summaryCards: [
      {
        label: '전체 관심 종목',
        value: `${total}개`,
        deltaLabel: '',
        trend: 'flat',
      },
      { label: '위험 증가 종목', value: '—', deltaLabel: '', trend: 'flat' },
      { label: '추가 리서치 필요', value: '—', deltaLabel: '', trend: 'flat' },
      { label: '평균 현금 연관도', value: '—', deltaLabel: '', trend: 'flat' },
    ],
    meta,
  }
}
