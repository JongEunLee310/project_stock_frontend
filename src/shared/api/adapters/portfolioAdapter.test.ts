import { adaptPortfolioSummary } from './portfolioAdapter'
import type { PortfolioSummaryDto } from '@/shared/model'

describe('portfolioAdapter', () => {
  it('adapts BE-calculated cash and sector weights', () => {
    const dto = {
      portfolio_id: 1,
      concentration_threshold: '0.3000',
      total_cost_value: '1000000.00',
      total_value: '1250000.00',
      cash_balance: '250000.00',
      cash_weight: '0.2000',
      has_sector_concentration: true,
      positions: [
        {
          asset_id: 10,
          quantity: '3.5',
          avg_buy_price: '100000.00',
          cost_value: '350000.00',
          market_value: '450000.00',
          cost_weight: '0.3500',
          weight: '0.3600',
          exceeds_threshold: true,
        },
      ],
      sector_weights: [
        {
          sector: 'Technology',
          market_value: '700000.00',
          weight: '0.5600',
          exceeds_threshold: true,
        },
      ],
    } satisfies PortfolioSummaryDto

    expect(adaptPortfolioSummary(dto)).toMatchObject({
      portfolioId: 1,
      cashWeight: 0.2,
      positions: [{ assetId: 10, quantity: 3.5, weight: 0.36 }],
      sectorWeights: [{ sector: 'Technology', weight: 0.56 }],
    })
  })
})
