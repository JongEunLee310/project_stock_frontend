import { describe, expect, it } from 'vitest'

import { adaptWatchlistItems } from './watchlist'

describe('adaptWatchlistItems', () => {
  it('converts expanded asset fields to watchlist stocks', () => {
    const result = adaptWatchlistItems(
      [
        {
          id: 1,
          watchlist_id: 1,
          asset_id: 10,
          priority: 1,
          reason: 'Core AI exposure',
          tags: ['ai'],
          memo: 'Watch earnings.',
          created_at: '2026-06-19T00:00:00Z',
          asset: {
            symbol: 'AAPL',
            name: 'Apple Inc.',
            price: '195.64',
            change_percent: '1.26',
            sector: 'Technology',
          },
        },
      ],
      { page: 1, size: 20, total: 28 },
    )

    expect(result.stocks[0]).toMatchObject({
      symbol: 'AAPL',
      name: 'Apple Inc.',
      price: 195.64,
      changePercent: 1.26,
      lastUpdatedAt: '2026-06-19T00:00:00Z',
    })
    expect(result.summaryCards[0]).toMatchObject({
      label: '전체 관심 종목',
      value: '28개',
      deltaLabel: '',
      trend: 'flat',
    })
  })
})
