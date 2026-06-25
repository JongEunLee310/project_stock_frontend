import { describe, expect, it } from 'vitest'

import { adaptPortfolioSummary } from './adapters'
import type { AssetDto, PortfolioSummaryDto } from './dto'

const summaryDto: PortfolioSummaryDto = {
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
}

const assetDto: AssetDto = {
  id: 1,
  symbol: 'AAPL',
  name: 'Apple Inc.',
  market: 'NASDAQ',
  is_active: true,
  created_at: '2026-06-19T00:00:00Z',
  sector: 'Technology',
}

describe('adaptPortfolioSummary', () => {
  it('maps summary, positions, assets, and sector weights', () => {
    const view = adaptPortfolioSummary(summaryDto, new Map([[1, assetDto]]))

    expect(view.totalValue).toBe(2056.4)
    expect(view.cash).toBe(100)
    expect(view.holdings[0]).toMatchObject({
      assetId: 1,
      symbol: 'AAPL',
      name: 'Apple Inc.',
      sector: 'Technology',
      quantity: 10,
      avgPrice: 100,
      currentValue: 1956.4,
    })
    expect(view.holdings[0].weight).toBeCloseTo(95.1371328535)
    expect(view.sectorExposure[0]).toMatchObject({
      name: 'Technology',
      amount: 1956.4,
    })
    expect(view.sectorExposure[0].value).toBeCloseTo(95.1371328535)
  })

  it('falls back to asset id and UNKNOWN when asset lookup is missing', () => {
    expect(
      adaptPortfolioSummary(summaryDto, new Map()).holdings[0],
    ).toMatchObject({
      symbol: '1',
      name: '1',
      sector: 'UNKNOWN',
    })
  })

  it('keeps parseDecimal null and empty boundaries as zero', () => {
    const view = adaptPortfolioSummary(
      {
        ...summaryDto,
        total_value: null,
        cash_balance: '',
        positions: [
          {
            ...summaryDto.positions[0],
            quantity: '',
            avg_buy_price: null,
            market_value: '',
            weight: null,
          },
        ],
        sector_weights: [
          {
            ...summaryDto.sector_weights[0],
            sector: null,
            market_value: null,
            weight: '',
          },
        ],
      },
      new Map([[1, assetDto]]),
    )

    expect(view.totalValue).toBe(0)
    expect(view.cash).toBe(0)
    expect(view.holdings[0]).toMatchObject({
      quantity: 0,
      avgPrice: 0,
      currentValue: 0,
      weight: 0,
    })
    expect(view.sectorExposure[0]).toEqual({
      name: 'UNKNOWN',
      amount: 0,
      value: 0,
    })
  })

  it('handles empty positions and sectors', () => {
    expect(
      adaptPortfolioSummary(
        { ...summaryDto, positions: [], sector_weights: [] },
        new Map(),
      ),
    ).toMatchObject({ holdings: [], sectorExposure: [] })
  })
})
