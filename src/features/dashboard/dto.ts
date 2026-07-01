export interface DashboardSummaryDto {
  risk_alert_count: number
  important_news_count: number
  review_signal_count: number
  cash_weight?: string | null
  risk_alert_delta: null
  important_news_delta: null
  review_signal_delta: null
  cash_weight_delta: null
}

export interface DashboardTrendPointDto {
  date: string
  count: number
}

export interface DashboardTrendSeriesItemDto {
  key: string
  data: DashboardTrendPointDto[]
}

export interface DashboardTrendSeriesDto {
  days: number
  series: DashboardTrendSeriesItemDto[]
}
