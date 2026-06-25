import { adaptPriceSeries } from './priceSeriesAdapter'
import type { PriceSeriesDto } from '@/shared/model'

describe('priceSeriesAdapter', () => {
  it('keeps bar calendar dates unchanged and preserves UTC lastUpdatedAt', () => {
    const dto = {
      symbol: 'AAPL',
      market: 'NASDAQ',
      currency: 'USD',
      interval: '1d',
      range: '1mo',
      source: 'BE',
      last_updated_at: '2026-06-24T21:00:00Z',
      bars: [
        {
          date: '2026-06-24',
          open: '200.10',
          high: '205.20',
          low: '198.00',
          close: '204.50',
          adjusted_close: '204.25',
          volume: 123456,
        },
      ],
    } satisfies PriceSeriesDto

    const priceSeries = adaptPriceSeries(dto)

    expect(priceSeries.lastUpdatedAt).toBe('2026-06-24T21:00:00Z')
    expect(priceSeries.bars[0]).toMatchObject({
      date: '2026-06-24',
      open: 200.1,
      high: 205.2,
      low: 198,
      close: 204.5,
      adjustedClose: 204.25,
      volume: 123456,
    })
  })
})
