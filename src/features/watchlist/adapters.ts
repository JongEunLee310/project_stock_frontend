import { parseDecimal } from '@/shared/lib/format'

import type { WatchlistItemDto } from './dto'

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
