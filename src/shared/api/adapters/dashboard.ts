import type { DashboardSummary as DomainDashboardSummary } from '@/shared/model'
import { parseDecimal } from '@/shared/lib/format/decimal'

export interface DashboardSummaryDto {
  risk_alert_count: number
  important_news_count: number
  review_signal_count: number
  cash_weight: string | null
  risk_alert_delta: null
  important_news_delta: null
  review_signal_delta: null
  cash_weight_delta: null
}

export type DashboardSummary = Omit<DomainDashboardSummary, 'cashRatio'> & {
  cashRatio: number | null
}

export function adaptDashboardSummary(
  dto: DashboardSummaryDto,
): DashboardSummary {
  const cashWeight = parseDecimal(dto.cash_weight)

  return {
    riskAlertCount: dto.risk_alert_count,
    importantNewsCount: dto.important_news_count,
    reviewSignalCount: dto.review_signal_count,
    cashRatio: cashWeight == null ? null : cashWeight * 100,
    riskAlertDelta: '',
    importantNewsDelta: '',
    reviewSignalDelta: '',
    cashRatioDelta: '',
  }
}
