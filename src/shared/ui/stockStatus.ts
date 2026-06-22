export type StockStatus =
  | '안정'
  | '관망'
  | '위험 증가'
  | '추가 리서치 필요'
  | '매수 검토 가능'

export const stockStatusClassNames: Record<StockStatus, string> = {
  안정: 'border-status-stable-border bg-status-stable-bg text-status-stable-text',
  관망: 'border-status-watch-border bg-status-watch-bg text-status-watch-text',
  '위험 증가': 'border-status-risk-border bg-status-risk-bg text-status-risk-text',
  '추가 리서치 필요':
    'border-status-research-border bg-status-research-bg text-status-research-text',
  '매수 검토 가능': 'border-status-buy-border bg-status-buy-bg text-status-buy-text',
}
