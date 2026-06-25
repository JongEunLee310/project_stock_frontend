import { describe, expect, it } from 'vitest'

import { adaptPortfolioSummary } from './portfolio'

describe('adaptPortfolioSummary', () => {
  it('converts decimal strings and ratio weights to percent values', () => {
    const summary = adaptPortfolioSummary({
      portfolio_id: 1,
      concentration_threshold: '0.4',
      total_cost_value: '1000',
      total_value: '2056.4',
      cash_balance: '100',
      cash_weight: '0.048628671465',
      has_sector_concentration: true,
      positions: [
        {
          asset_id: 1,
          quantity: '10',
          avg_buy_price: '100',
          cost_value: '1000',
          market_value: '1956.4',
          cost_weight: '1',
          weight: '0.951371328535',
          exceeds_threshold: true,
        },
      ],
      sector_weights: [
        {
          sector: 'Technology',
          market_value: '1956.4',
          weight: '0.951371328535',
          exceeds_threshold: true,
        },
      ],
    })

    expect(summary.totalValue).toBeCloseTo(2056.4)
    expect(summary.cashRatio).toBeCloseTo(4.8628671465)
    expect(summary.holdings[0].weight).toBeCloseTo(95.1371328535)
    expect(summary.sectorWeights[0].value).toBeCloseTo(95.1371328535)
  })
})
