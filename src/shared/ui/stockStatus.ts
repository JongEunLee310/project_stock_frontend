import type { DecisionType, RiskLevel, StockStatus } from '@/shared/model'

export type { DecisionType, RiskLevel, StockStatus } from '@/shared/model'

export type BadgeTone = 'neutral' | 'accent' | 'info' | 'warning'

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
  관망: 'border-status-watch-hold-border bg-status-watch-hold-bg text-status-watch-hold-text',
  '매수 검토': 'border-status-buy-border bg-status-buy-bg text-status-buy-text',
  매수: 'border-status-buy-border bg-status-buy-bg text-status-buy-text',
  '보유 유지':
    'border-status-watch-hold-border bg-status-watch-hold-bg text-status-watch-hold-text',
  '매도 검토':
    'border-status-reduce-border bg-status-reduce-bg text-status-reduce-text',
  매도: 'border-status-reduce-border bg-status-reduce-bg text-status-reduce-text',
  보류: 'border-status-research-border bg-status-research-bg text-status-research-text',
  리밸런싱:
    'border-status-research-border bg-status-research-bg text-status-research-text',
  '차익 실현': 'border-status-buy-border bg-status-buy-bg text-status-buy-text',
  손절: 'border-status-risk-border bg-status-risk-bg text-status-risk-text',
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
}
