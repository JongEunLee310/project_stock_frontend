import type { DecisionType, RiskLevel, StockStatus } from '@/shared/model'

export type { DecisionType, RiskLevel, StockStatus } from '@/shared/model'

export type BadgeTone =
  | 'neutral'
  | 'accent'
  | 'info'
  | 'warning'
  | 'danger'
  | 'success'

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

export const decisionTypeClassNames: Record<DecisionType, string> = {
  '관찰 지속':
    'border-status-watch-hold-border bg-status-watch-hold-bg text-status-watch-hold-text',
  '추가 리서치 필요':
    'border-status-research-border bg-status-research-bg text-status-research-text',
  '관망 유지':
    'border-status-watch-hold-border bg-status-watch-hold-bg text-status-watch-hold-text',
  '매수 검토': 'border-status-buy-border bg-status-buy-bg text-status-buy-text',
  '매도 검토':
    'border-status-reduce-border bg-status-reduce-bg text-status-reduce-text',
  '비중 축소 검토':
    'border-status-reduce-border bg-status-reduce-bg text-status-reduce-text',
  '리밸런싱 검토':
    'border-status-research-border bg-status-research-bg text-status-research-text',
  '투자 가설 훼손':
    'border-status-risk-border bg-status-risk-bg text-status-risk-text',
  '행동하지 않음': 'border-app-border bg-app-surface-muted text-app-text-muted',
}

export const riskLevelClassNames: Record<RiskLevel, string> = {
  높음: 'border-status-level-high-border bg-status-level-high-bg text-status-level-high-text',
  중간: 'border-status-level-medium-border bg-status-level-medium-bg text-status-level-medium-text',
  낮음: 'border-status-level-low-border bg-status-level-low-bg text-status-level-low-text',
}

export const badgeToneClassNames: Record<BadgeTone, string> = {
  neutral: 'border-app-border bg-app-surface-muted text-app-text-muted',
  accent: 'border-app-accent/40 bg-app-accent/15 text-app-accent',
  info: 'border-sky-400/40 bg-sky-400/10 text-sky-200',
  warning: 'border-amber-400/40 bg-amber-400/10 text-amber-200',
  danger: 'border-red-400/40 bg-red-400/10 text-red-200',
  success: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200',
}
