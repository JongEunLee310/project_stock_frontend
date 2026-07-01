import { describe, expect, it } from 'vitest'

import { adaptMarketIndexBoard } from './adapters'
import type { MarketIndexQuoteDto } from './dto'

const marketIndexDtos: MarketIndexQuoteDto[] = [
  {
    symbol: 'SPX',
    name: 'S&P 500',
    value: '5278.40',
    change_percent: '0.47',
    reference_at: '2026-07-01T05:31:00Z',
  },
  {
    symbol: 'KOSPI',
    name: 'KOSPI',
    value: '2725.49',
    change_percent: '-0.16',
    reference_at: '2026-07-01T05:32:00Z',
  },
]

describe('adaptMarketIndexBoard', () => {
  it('maps decimal string fields into numeric domain fields', () => {
    expect(adaptMarketIndexBoard(marketIndexDtos).indices).toEqual([
      {
        symbol: 'SPX',
        name: 'S&P 500',
        value: 5278.4,
        changePercent: 0.47,
      },
      {
        symbol: 'KOSPI',
        name: 'KOSPI',
        value: 2725.49,
        changePercent: -0.16,
      },
    ])
  })

  it('returns an empty board for an empty list', () => {
    expect(adaptMarketIndexBoard([])).toEqual({
      indices: [],
      referenceAt: null,
    })
  })

  it('falls back to zero when decimal parsing fails', () => {
    expect(
      adaptMarketIndexBoard([
        {
          ...marketIndexDtos[0],
          value: '',
          change_percent: 'not-a-number',
        },
      ]).indices[0],
    ).toMatchObject({
      value: 0,
      changePercent: 0,
    })
  })

  it('uses the first quote reference_at as the board referenceAt', () => {
    expect(adaptMarketIndexBoard(marketIndexDtos).referenceAt).toBe(
      '2026-07-01T05:31:00Z',
    )
  })

  it('does not expose reference_at on individual market indices', () => {
    expect(
      adaptMarketIndexBoard(marketIndexDtos).indices[0],
    ).not.toHaveProperty('reference_at')
    expect(
      adaptMarketIndexBoard(marketIndexDtos).indices[0],
    ).not.toHaveProperty('referenceAt')
  })
})
