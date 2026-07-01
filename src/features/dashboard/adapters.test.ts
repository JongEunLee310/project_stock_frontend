import { describe, expect, it } from 'vitest'

import { adaptDashboardSummary, adaptDashboardTrends } from './adapters'
import type { DashboardSummaryDto, DashboardTrendSeriesDto } from './dto'

const baseDto: DashboardSummaryDto = {
  risk_alert_count: 2,
  important_news_count: 5,
  review_signal_count: 3,
  cash_weight: '0.18',
  risk_alert_delta: null,
  important_news_delta: null,
  review_signal_delta: null,
  cash_weight_delta: null,
}

describe('adaptDashboardSummary', () => {
  it('maps summary counts and cash weight percent', () => {
    expect(adaptDashboardSummary(baseDto)).toEqual({
      riskAlertCount: 2,
      importantNewsCount: 5,
      reviewSignalCount: 3,
      cashRatio: 18,
      riskAlertDelta: null,
      importantNewsDelta: null,
      reviewSignalDelta: null,
      cashRatioDelta: null,
    })
  })

  it('treats null and empty cash weight as zero', () => {
    expect(
      adaptDashboardSummary({ ...baseDto, cash_weight: null }).cashRatio,
    ).toBe(0)
    expect(
      adaptDashboardSummary({ ...baseDto, cash_weight: '' }).cashRatio,
    ).toBe(0)
  })
})

describe('adaptDashboardTrends', () => {
  it('maps each trend series by key', () => {
    const dto: DashboardTrendSeriesDto = {
      days: 14,
      series: [
        {
          key: 'important_news',
          data: [
            { date: '2026-06-29', count: 8 },
            { date: '2026-06-30', count: 13 },
          ],
        },
        {
          key: 'risk_alerts',
          data: [
            { date: '2026-06-29', count: 2 },
            { date: '2026-06-30', count: 4 },
          ],
        },
        {
          key: 'review_signals',
          data: [
            { date: '2026-06-29', count: 5 },
            { date: '2026-06-30', count: 7 },
          ],
        },
      ],
    }

    expect(adaptDashboardTrends(dto)).toEqual({
      riskAlerts: [2, 4],
      reviewSignals: [5, 7],
      importantNews: [8, 13],
    })
  })

  it('uses an empty array when a trend key is missing', () => {
    const dto: DashboardTrendSeriesDto = {
      days: 14,
      series: [
        {
          key: 'risk_alerts',
          data: [{ date: '2026-06-30', count: 2 }],
        },
        {
          key: 'important_news',
          data: [{ date: '2026-06-30', count: 8 }],
        },
      ],
    }

    expect(adaptDashboardTrends(dto)).toEqual({
      riskAlerts: [2],
      reviewSignals: [],
      importantNews: [8],
    })
  })

  it('uses empty arrays when no trend series are returned', () => {
    expect(adaptDashboardTrends({ days: 14, series: [] })).toEqual({
      riskAlerts: [],
      reviewSignals: [],
      importantNews: [],
    })
  })

  it('preserves numeric counts without conversion', () => {
    const dto: DashboardTrendSeriesDto = {
      days: 14,
      series: [
        {
          key: 'risk_alerts',
          data: [{ date: '2026-06-30', count: 0 }],
        },
        {
          key: 'review_signals',
          data: [{ date: '2026-06-30', count: 1 }],
        },
        {
          key: 'important_news',
          data: [{ date: '2026-06-30', count: 2 }],
        },
      ],
    }

    const trends = adaptDashboardTrends(dto)

    expect(trends.riskAlerts[0]).toBe(0)
    expect(trends.reviewSignals[0]).toBe(1)
    expect(trends.importantNews[0]).toBe(2)
  })
})
