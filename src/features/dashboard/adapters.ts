import { parseDecimal } from '@/shared/lib/format'

import type { DashboardSummaryDto } from './dto'

export interface DashboardSummary {
  riskAlertCount: number
  importantNewsCount: number
  reviewSignalCount: number
  cashRatio: number
  riskAlertDelta: string | null
  importantNewsDelta: string | null
  reviewSignalDelta: string | null
  cashRatioDelta: string | null
}

export function adaptDashboardSummary(
  dto: DashboardSummaryDto,
): DashboardSummary {
  return {
    riskAlertCount: dto.risk_alert_count,
    importantNewsCount: dto.important_news_count,
    reviewSignalCount: dto.review_signal_count,
    cashRatio: (parseDecimal(dto.cash_weight) ?? 0) * 100,
    riskAlertDelta: null,
    importantNewsDelta: null,
    reviewSignalDelta: null,
    cashRatioDelta: null,
  }
}
