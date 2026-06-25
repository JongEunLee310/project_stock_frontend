import { describe, expect, it } from 'vitest'

import { adaptDashboardSummary } from './dashboard'

describe('adaptDashboardSummary', () => {
  it('converts cash weight ratio to percent and hides null deltas', () => {
    const summary = adaptDashboardSummary({
      risk_alert_count: 2,
      important_news_count: 5,
      review_signal_count: 3,
      cash_weight: '0.18',
      risk_alert_delta: null,
      important_news_delta: null,
      review_signal_delta: null,
      cash_weight_delta: null,
    })

    expect(summary.cashRatio).toBeCloseTo(18)
    expect(summary.riskAlertDelta).toBe('')
    expect(summary.importantNewsDelta).toBe('')
    expect(summary.reviewSignalDelta).toBe('')
    expect(summary.cashRatioDelta).toBe('')
  })
})
