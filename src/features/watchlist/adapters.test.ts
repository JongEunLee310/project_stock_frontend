import { describe, expect, it } from 'vitest'

import { adaptWatchlistAsset } from './adapters'
import type { WatchlistItemDto } from './dto'

const itemDto: WatchlistItemDto = {
  id: 1,
  watchlist_id: 1,
  asset_id: 1,
  priority: 10,
  reason: 'Core AI exposure',
  tags: ['ai', 'large-cap'],
  memo: 'Watch earnings.',
  created_at: '2026-06-19T00:00:00Z',
  asset: {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: '195.64',
    change_percent: '1.26',
    sector: 'Technology',
  },
}

describe('adaptWatchlistAsset', () => {
  it('maps expanded asset item into a thin watchlist row', () => {
    expect(adaptWatchlistAsset(itemDto)).toEqual({
      id: 1,
      symbol: 'AAPL',
      name: 'Apple Inc.',
      price: 195.64,
      changePercent: 1.26,
      sector: 'Technology',
      reason: 'Core AI exposure',
      tags: ['ai', 'large-cap'],
      memo: 'Watch earnings.',
      createdAt: '2026-06-19T00:00:00Z',
      isFavorite: true,
    })
  })

  it('skips items when expand=asset was not provided', () => {
    expect(adaptWatchlistAsset({ ...itemDto, asset: undefined })).toBeNull()
  })

  it('keeps parseDecimal null boundaries and falls back unknown sector', () => {
    expect(
      adaptWatchlistAsset({
        ...itemDto,
        asset: {
          ...itemDto.asset!,
          price: '',
          change_percent: null,
          sector: null,
        },
      }),
    ).toMatchObject({
      price: null,
      changePercent: null,
      sector: 'UNKNOWN',
    })
  })
})
