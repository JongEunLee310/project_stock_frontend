import { describe, expect, it } from 'vitest'

import { adaptDashboardSummary } from './adapters'
import type { DashboardSummaryDto } from './dto'

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
