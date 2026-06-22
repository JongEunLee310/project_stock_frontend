import type { RiskLevel, StockStatus } from '@/shared/model'

export type { RiskLevel, StockStatus } from '@/shared/model'

export const stockStatusClassNames: Record<StockStatus, string> = {
  안정: 'border-status-stable-border bg-status-stable-bg text-status-stable-text',
  관망: 'border-status-watch-border bg-status-watch-bg text-status-watch-text',
  '관망 유지':
    'border-status-watch-hold-border bg-status-watch-hold-bg text-status-watch-hold-text',
  '위험 증가':
    'border-status-risk-border bg-status-risk-bg text-status-risk-text',
  '추가 리서치 필요':
    'border-status-research-border bg-status-research-bg text-status-research-text',
  '매수 검토 가능':
    'border-status-buy-border bg-status-buy-bg text-status-buy-text',
  '비중 축소 검토':
    'border-status-reduce-border bg-status-reduce-bg text-status-reduce-text',
}

export const riskLevelClassNames: Record<RiskLevel, string> = {
  높음: 'border-status-level-high-border bg-status-level-high-bg text-status-level-high-text',
  중간: 'border-status-level-medium-border bg-status-level-medium-bg text-status-level-medium-text',
  낮음: 'border-status-level-low-border bg-status-level-low-bg text-status-level-low-text',
}
