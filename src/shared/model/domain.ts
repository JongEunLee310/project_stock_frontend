import type { StockStatus } from './stockStatus'

export interface Stock {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  status: StockStatus
}

export type SignalKind =
  | 'price_momentum'
  | 'earnings'
  | 'valuation'
  | 'news'
  | 'technical'

export interface Signal {
  id: string
  symbol: string
  kind: SignalKind
  message: string
  createdAt: string
  status: StockStatus
}

export interface Holding {
  symbol: string
  quantity: number
  avgPrice: number
  currentValue: number
}

export interface Portfolio {
  totalValue: number
  holdings: Holding[]
}

export type AlertCondition =
  | 'price_above'
  | 'price_below'
  | 'status_changed'
  | 'change_percent_above'

export interface AlertRule {
  id: string
  symbol: string | null
  condition: AlertCondition
  threshold: number
  enabled: boolean
}

export interface DecisionLog {
  id: string
  symbol: string
  decision: string
  rationale: string
  createdAt: string
}
