import { describe, expect, it } from 'vitest'

import {
  adaptWatchlistAsset,
  adaptWatchlistSummary,
  adaptWatchlistSummaryTrends,
  getWatchlistTrendCounts,
  resolveStatusBadge,
} from './adapters'
import type {
  WatchlistItemDto,
  WatchlistSummaryDto,
  WatchlistTrendSeriesDto,
} from './dto'

const itemDto: WatchlistItemDto = {
  id: 1,
  watchlist_id: 1,
  asset_id: 1,
  priority: 10,
  reason: 'Core AI exposure',
  tags: ['ai', 'large-cap'],
  memo: 'Watch earnings.',
  created_at: '2026-06-19T00:00:00Z',
  status: 'NORMAL', // app/domains/signals/types.py:4-13
  asset: {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    market: 'NASDAQ',
    price: '195.64',
    change_percent: '1.26',
    sector: 'Technology',
    currency: 'USD',
    reference_at: '2026-06-20T00:00:00Z',
  },
}

describe('adaptWatchlistAsset', () => {
  it('maps expanded asset item into a thin watchlist row', () => {
    expect(adaptWatchlistAsset(itemDto)).toEqual({
      id: 1,
      symbol: 'AAPL',
      market: 'NASDAQ',
      name: 'Apple Inc.',
      price: 195.64,
      changePercent: 1.26,
      currency: 'USD',
      sector: 'Technology',
      reason: 'Core AI exposure',
      tags: ['ai', 'large-cap'],
      memo: 'Watch earnings.',
      status: 'NORMAL',
      referenceAt: '2026-06-20T00:00:00Z',
    })
    expect(adaptWatchlistAsset(itemDto)).not.toHaveProperty('createdAt')
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

  it('falls back to null currency when the backend omits the field', () => {
    const asset = { ...itemDto.asset! }
    delete asset.currency

    expect(adaptWatchlistAsset({ ...itemDto, asset })).toMatchObject({
      currency: null,
    })
  })

  it('falls back to UNKNOWN market when the backend omits the field', () => {
    const asset = { ...itemDto.asset! }
    delete asset.market

    expect(adaptWatchlistAsset({ ...itemDto, asset })).toMatchObject({
      market: 'UNKNOWN',
    })
  })
})

describe('resolveStatusBadge', () => {
  it.each([
    ['NORMAL', '안정'],
    ['WATCH', '관망'],
    ['BUY_CANDIDATE', '관망'],
    ['RISK_ALERT', '위험 증가'],
    ['THESIS_BROKEN', '위험 증가'],
    ['SELL_REVIEW', '위험 증가'],
    ['OVERHEATED', '위험 증가'],
    // app/domains/signals/types.py:4-13
  ] as const)('maps %s to %s', (status, label) => {
    const badge = resolveStatusBadge(status)

    expect(badge.label).toBe(label)
    expect(badge.className).toContain('status-')
  })

  it('falls back to stable for an unknown status', () => {
    expect(resolveStatusBadge('UNKNOWN')).toMatchObject({
      label: '안정',
      className:
        'border-status-stable-border bg-status-stable-bg text-status-stable-text',
    })
  })
})

describe('adaptWatchlistSummary', () => {
  const summaryDto: WatchlistSummaryDto = {
    total_count: 12,
    risk_increasing_count: 3,
    recent_items: [
      {
        symbol: 'NVDA',
        name: 'NVIDIA Corp.',
        created_at: '2026-06-20T03:00:00Z',
      },
    ],
  }

  it('maps watchlist summary and recent additions', () => {
    expect(adaptWatchlistSummary(summaryDto)).toEqual({
      totalCount: 12,
      riskIncreasingCount: 3,
      recentItems: [
        {
          symbol: 'NVDA',
          name: 'NVIDIA Corp.',
          addedAt: '2026-06-20T03:00:00Z',
        },
      ],
    })
  })

  it('falls back to an empty recent item list', () => {
    expect(
      adaptWatchlistSummary({
        total_count: 0,
        risk_increasing_count: 0,
      }),
    ).toEqual({
      totalCount: 0,
      riskIncreasingCount: 0,
      recentItems: [],
    })
  })
})

describe('watchlist summary trends adapters', () => {
  const trendsDto: WatchlistTrendSeriesDto = {
    days: 14,
    series: [
      {
        key: 'watchlist_total',
        data: [
          { date: '2026-06-29', count: 0 },
          { date: '2026-06-30', count: 12 },
        ],
      },
      {
        key: 'risk_increasing',
        data: [
          { date: '2026-06-29', count: 1 },
          { date: '2026-06-30', count: 3 },
        ],
      },
      {
        key: 'empty_series',
        data: [],
      },
    ],
  }

  it('extracts watchlist total count series', () => {
    expect(getWatchlistTrendCounts(trendsDto, 'watchlist_total')).toEqual([
      0, 12,
    ])
  })

  it('extracts risk increasing count series', () => {
    expect(getWatchlistTrendCounts(trendsDto, 'risk_increasing')).toEqual([
      1, 3,
    ])
  })

  it('returns an empty array for a missing key', () => {
    expect(getWatchlistTrendCounts(trendsDto, 'missing')).toEqual([])
  })

  it('returns an empty array for an empty series', () => {
    expect(getWatchlistTrendCounts(trendsDto, 'empty_series')).toEqual([])
  })

  it('preserves zero-filled points', () => {
    expect(getWatchlistTrendCounts(trendsDto, 'watchlist_total')[0]).toBe(0)
  })

  it('maps summary trend series into the view shape', () => {
    expect(adaptWatchlistSummaryTrends(trendsDto)).toEqual({
      watchlistTotal: [0, 12],
      riskIncreasing: [1, 3],
    })
  })
})
