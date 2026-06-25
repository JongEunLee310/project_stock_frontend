import { describe, expect, it } from 'vitest'

import {
  adaptPriceSeries,
  adaptSignal,
  getSeriesChangePercent,
} from './adapters'
import type { PriceSeriesDto, SignalDto } from './dto'

const signal: SignalDto = {
  id: 1,
  asset_id: 10,
  thesis_id: 2,
  news_item_id: null,
  signal_type: 'RISK_ALERT',
  score: 80,
  risk_level: 'HIGH',
  reason: 'Thesis conflict detected',
  evidence: { symbol: 'AAPL', report_id: 1 },
  expires_at: '2026-06-26T00:00:00Z',
  is_expired: false,
  created_at: '2026-06-19T00:00:00Z',
}

describe('signals adapters', () => {
  it('maps signal DTO to screen view', () => {
    expect(adaptSignal(signal, [100, 110])).toMatchObject({
      id: '1',
      assetId: 10,
      symbol: 'AAPL',
      signalTypeLabel: '리스크 알림',
      score: 80,
      riskLevel: '높음',
      oneMonthChangePercent: 10,
    })
  })

  it('keeps missing BE-only symbol nullable and hides price-derived values', () => {
    const view = adaptSignal({ ...signal, evidence: null })
    expect(view.symbol).toBeNull()
    expect(view.trendSeries).toEqual([])
    expect(view.oneMonthChangePercent).toBeNull()
  })

  it('maps price close values and skips null-like decimal boundaries', () => {
    const prices: PriceSeriesDto = {
      symbol: 'AAPL',
      market: 'NASDAQ',
      currency: 'USD',
      interval: '1d',
      range: '1M',
      source: 'mock',
      last_updated_at: '2026-06-25T06:00:00Z',
      bars: [
        {
          date: '2026-06-24',
          open: '1',
          high: '1',
          low: '1',
          close: '',
          adjusted_close: '',
          volume: 1,
        },
        {
          date: '2026-06-25',
          open: '2',
          high: '2',
          low: '2',
          close: '2.5',
          adjusted_close: '2.5',
          volume: 1,
        },
      ],
    }
    expect(adaptPriceSeries(prices)).toEqual([2.5])
  })

  it('handles empty series change boundaries', () => {
    expect(getSeriesChangePercent([])).toBeNull()
    expect(getSeriesChangePercent([0, 10])).toBeNull()
  })
})
