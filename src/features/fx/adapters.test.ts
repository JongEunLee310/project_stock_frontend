import { describe, expect, it } from 'vitest'

import { adaptFxRates, findFxRateByPair } from './adapters'

describe('fx adapters', () => {
  it('maps exchange rate decimals into numbers', () => {
    expect(
      adaptFxRates([
        {
          pair: 'USD/KRW',
          rate: '1390.50',
          change_percent: '0.35',
          reference_at: '2026-07-07T01:00:00Z',
        },
      ]),
    ).toEqual([
      {
        pair: 'USD/KRW',
        rate: 1390.5,
        changePercent: 0.35,
        referenceAt: '2026-07-07T01:00:00Z',
      },
    ])
  })

  it('finds rates by pair', () => {
    const rates = adaptFxRates([
      {
        pair: 'USD/KRW',
        rate: '1390.50',
        change_percent: '0.35',
        reference_at: '2026-07-07T01:00:00Z',
      },
    ])

    expect(findFxRateByPair(rates, 'USD/KRW')?.rate).toBe(1390.5)
    expect(findFxRateByPair(rates, 'EUR/KRW')).toBeUndefined()
  })
})
