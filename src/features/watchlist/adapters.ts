import { parseDecimal } from '@/shared/lib/format'
import { stockStatusClassNames } from '@/shared/ui/stockStatus'

import type {
  BuyReadinessDto,
  WatchlistEvaluationsResponseDto,
  WatchlistItemDto,
  WatchlistSummaryDto,
  WatchlistTrendSeriesDto,
} from './dto'

export interface WatchlistAssetRow {
  id: number
  symbol: string
  market: string
  name: string
  price: number | null
  changePercent: number | null
  currency: string | null
  sector: string
  reason: string | null
  tags: string[]
  memo: string | null
  status: string
  referenceAt: string | null
}

export interface RecentWatchlistView {
  symbol: string
  name: string
  addedAt: string
}

export interface WatchlistEvaluationRow {
  symbol: string
  newsRisk: string
  valuationBurden: string
  themeHeat: string
  aiJudgment: string
}

export type WatchlistEvaluationMap = Record<string, WatchlistEvaluationRow>

export interface BuyReadinessView {
  level: string
  levelLabel: string
  cashWeight: number
  buyCandidateCount: number
  message: string
}

export interface WatchlistSummaryView {
  totalCount: number
  riskIncreasingCount: number
  recentItems: RecentWatchlistView[]
  buyReadiness: BuyReadinessView | null
}

export interface WatchlistSummaryTrendsView {
  watchlistTotal: number[]
  riskIncreasing: number[]
}

export function resolveStatusBadge(status: string): {
  label: '안정' | '관망' | '위험 증가'
  className: string
} {
  if (status === 'WATCH' || status === 'BUY_CANDIDATE') {
    return { label: '관망', className: stockStatusClassNames['관망'] }
  }

  if (
    status === 'RISK_ALERT' ||
    status === 'THESIS_BROKEN' ||
    status === 'SELL_REVIEW' ||
    status === 'OVERHEATED'
  ) {
    return {
      label: '위험 증가',
      className: stockStatusClassNames['위험 증가'],
    }
  }

  return { label: '안정', className: stockStatusClassNames['안정'] }
}

const evaluationBadgeClassNames = {
  danger: 'border-rose-500/50 bg-rose-500/15 text-rose-200',
  warning: 'border-amber-500/50 bg-amber-500/15 text-amber-200',
  safe: 'border-emerald-500/50 bg-emerald-500/15 text-emerald-200',
  neutral: 'border-slate-500/50 bg-slate-500/15 text-slate-200',
} as const

export function resolveNewsRiskBadge(value: string): {
  label: string
  className: string
} {
  if (value === 'HIGH') {
    return { label: '높음', className: evaluationBadgeClassNames.danger }
  }

  if (value === 'LOW') {
    return { label: '낮음', className: evaluationBadgeClassNames.safe }
  }

  if (value === 'MEDIUM') {
    return { label: '중간', className: evaluationBadgeClassNames.warning }
  }

  return { label: '중간', className: evaluationBadgeClassNames.neutral }
}

export function resolveValuationBadge(value: string): {
  label: string
  className: string
} {
  if (value === 'HIGH') {
    return { label: '고평가', className: evaluationBadgeClassNames.danger }
  }

  if (value === 'LOW') {
    return { label: '저평가', className: evaluationBadgeClassNames.safe }
  }

  return { label: '적정', className: evaluationBadgeClassNames.neutral }
}

export function resolveThemeHeatBadge(value: string): {
  label: string
  className: string
} {
  if (value === 'OVERHEATED') {
    return { label: '과열', className: evaluationBadgeClassNames.danger }
  }

  if (value === 'COLD') {
    return { label: '냉각', className: evaluationBadgeClassNames.safe }
  }

  return { label: '중립', className: evaluationBadgeClassNames.neutral }
}

export function resolveAiJudgmentBadge(value: string): {
  label: string
  className: string
} {
  if (value === 'RISK_INCREASING') {
    return { label: '위험 증가', className: evaluationBadgeClassNames.danger }
  }

  if (value === 'WATCH') {
    return { label: '관망', className: evaluationBadgeClassNames.warning }
  }

  return { label: '안정', className: evaluationBadgeClassNames.safe }
}

export function adaptWatchlistAsset(
  item: WatchlistItemDto,
): WatchlistAssetRow | null {
  if (!item.asset) return null

  return {
    id: item.id,
    symbol: item.asset.symbol,
    market: item.asset.market ?? 'UNKNOWN',
    name: item.asset.name,
    price: parseDecimal(item.asset.price),
    changePercent: parseDecimal(item.asset.change_percent),
    currency: item.asset.currency ?? null,
    sector: item.asset.sector ?? 'UNKNOWN',
    reason: item.reason,
    tags: item.tags,
    memo: item.memo,
    status: item.status,
    referenceAt: item.asset.reference_at ?? null,
  }
}

export function adaptWatchlistEvaluations(
  dto: WatchlistEvaluationsResponseDto,
): { map: WatchlistEvaluationMap; needsResearchCount: number } {
  return {
    map: dto.items.reduce<WatchlistEvaluationMap>((acc, item) => {
      acc[item.symbol] = {
        symbol: item.symbol,
        newsRisk: item.news_risk,
        valuationBurden: item.valuation_burden,
        themeHeat: item.theme_heat,
        aiJudgment: item.ai_judgment,
      }

      return acc
    }, {}),
    needsResearchCount: dto.needs_research_count,
  }
}

export function adaptBuyReadiness(dto: BuyReadinessDto): BuyReadinessView {
  return {
    level: dto.level,
    levelLabel: dto.level_label,
    cashWeight: parseDecimal(dto.cash_weight) ?? 0,
    buyCandidateCount: dto.buy_candidate_count,
    message: dto.message,
  }
}

export function adaptWatchlistSummary(
  dto: WatchlistSummaryDto,
): WatchlistSummaryView {
  return {
    totalCount: dto.total_count,
    riskIncreasingCount: dto.risk_increasing_count,
    recentItems: (dto.recent_items ?? []).map((item) => ({
      symbol: item.symbol,
      name: item.name,
      addedAt: item.created_at,
    })),
    buyReadiness: dto.buy_readiness
      ? adaptBuyReadiness(dto.buy_readiness)
      : null,
  }
}

export function getWatchlistTrendCounts(
  dto: WatchlistTrendSeriesDto,
  key: string,
): number[] {
  return (
    dto.series
      .find((item) => item.key === key)
      ?.data.map((point) => point.count) ?? []
  )
}

export function adaptWatchlistSummaryTrends(
  dto: WatchlistTrendSeriesDto,
): WatchlistSummaryTrendsView {
  return {
    watchlistTotal: getWatchlistTrendCounts(dto, 'watchlist_total'),
    riskIncreasing: getWatchlistTrendCounts(dto, 'risk_increasing'),
  }
}
