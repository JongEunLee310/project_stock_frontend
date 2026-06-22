import type { CatalystCategory } from './catalystCategory'
import type { DecisionType } from './decisionType'
import type { NewsCategory } from './newsCategory'
import type { RiskLevel } from './riskLevel'
import type { StockStatus } from './stockStatus'
import type { ValuationLevel } from './valuationLevel'

export interface Stock {
  symbol: string
  name: string
  market: string
  price: number
  change: number
  changePercent: number
  status: StockStatus
  newsRisk: RiskLevel
  valuation: ValuationLevel
  aiVerdict: string
  themeHeat: RiskLevel
  lastUpdatedAt: string
  isFavorite: boolean
  changeSeries?: number[]
}

export type WatchlistTrend = 'up' | 'down' | 'flat'

export interface WatchlistSummaryCard {
  label: string
  value: string
  deltaLabel: string
  trend: WatchlistTrend
}

export interface WatchlistObservation {
  id: string
  text: string
}

export interface RecentWatchlistItem {
  symbol: string
  name: string
  status: StockStatus
  addedAt: string
}

export interface WatchlistAlertSetting {
  label: string
  value: string
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
  confidence: number
  reasons: string[]
  updatedAt: string
  priority: number
}

export interface DashboardSummary {
  riskAlertCount: number
  importantNewsCount: number
  reviewSignalCount: number
  cashRatio: number
}

export interface AiBriefing {
  headline: string
  body: string
}

export interface PriorityQueueItem {
  id: string
  symbol: string
  reason: string
  risk: RiskLevel
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
  decisionType: DecisionType
  rationale: string
  cognitiveRisks: string[]
  reviewDate: string
  createdAt: string
}

export interface PricePoint {
  date: string
  close: number
}

export interface ResearchRisk {
  id: string
  title: string
  level: RiskLevel
  description: string
}

export interface NewsItem {
  id: string
  category: NewsCategory
  headline: string
  source: string
  publishedAt: string
  risk: RiskLevel
}

export interface CatalystItem {
  id: string
  category: CatalystCategory
  date: string
  title: string
  description: string
}

export interface ChecklistItem {
  id: string
  label: string
  description: string
  checked: boolean
}

export interface StockResearch {
  symbol: string
  pricePoints: PricePoint[]
  priceAsOf: string
  stance: string
  stanceConfidence: number
  marketCap: string
  fiftyTwoWeekLow: number
  fiftyTwoWeekHigh: number
  sector: string
  nextEarningsDate: string
  targetPrice: number
  targetUpsidePercent: number
  briefing: AiBriefing
  keyRisks: ResearchRisk[]
  news: NewsItem[]
  catalysts: CatalystItem[]
  checklist: ChecklistItem[]
  memo: string
}

export interface DecisionPattern {
  id: string
  label: string
  count: number
}

export interface ReviewMemo {
  id: string
  symbol: string
  memo: string
  reviewedAt: string
}
