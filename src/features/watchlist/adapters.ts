import { parseDecimal } from '@/shared/lib/format'

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

export type WatchlistBadgeIndicator =
  | { kind: 'dot'; className: string }
  | { kind: 'glyph'; className: string; glyph: string }

export function resolveStatusBadge(status: string): {
  label: '안정' | '관망' | '위험 증가'
  className: string
  indicator: WatchlistBadgeIndicator
} {
  if (status === 'WATCH' || status === 'BUY_CANDIDATE') {
    return {
      label: '관망',
      className: evaluationBadgeClassNames.warning,
      indicator: evaluationBadgeIndicators.warning,
    }
  }

  if (
    status === 'RISK_ALERT' ||
    status === 'THESIS_BROKEN' ||
    status === 'SELL_REVIEW' ||
    status === 'OVERHEATED'
  ) {
    return {
      label: '위험 증가',
      className: evaluationBadgeClassNames.danger,
      indicator: evaluationBadgeIndicators.danger,
    }
  }

  return {
    label: '안정',
    className: evaluationBadgeClassNames.safe,
    indicator: evaluationBadgeIndicators.safe,
  }
}

const evaluationBadgeClassNames = {
  danger: 'bg-rose-500/10 text-rose-300',
  warning: 'bg-amber-500/10 text-amber-300',
  safe: 'bg-emerald-500/10 text-emerald-300',
  neutral: 'bg-slate-500/10 text-slate-300',
} as const

const evaluationBadgeIndicators = {
  danger: {
    kind: 'glyph',
    className: 'text-rose-400',
    glyph: '⚠︎',
  },
  warning: {
    kind: 'glyph',
    className: 'text-amber-400 font-bold',
    glyph: '!',
  },
  safe: {
    kind: 'dot',
    className: 'bg-emerald-400',
  },
  neutral: {
    kind: 'dot',
    className: 'bg-slate-400',
  },
} as const

export function resolveNewsRiskBadge(value: string): {
  label: string
  className: string
  indicator: WatchlistBadgeIndicator
} {
  if (value === 'HIGH') {
    return {
      label: '높음',
      className: evaluationBadgeClassNames.danger,
      indicator: evaluationBadgeIndicators.danger,
    }
  }

  if (value === 'LOW') {
    return {
      label: '낮음',
      className: evaluationBadgeClassNames.safe,
      indicator: evaluationBadgeIndicators.safe,
    }
  }

  if (value === 'MEDIUM') {
    return {
      label: '중간',
      className: evaluationBadgeClassNames.warning,
      indicator: evaluationBadgeIndicators.warning,
    }
  }

  return {
    label: '중간',
    className: evaluationBadgeClassNames.neutral,
    indicator: evaluationBadgeIndicators.neutral,
  }
}

export function resolveValuationBadge(value: string): {
  label: string
  className: string
  indicator: WatchlistBadgeIndicator
} {
  if (value === 'HIGH') {
    return {
      label: '고평가',
      className: evaluationBadgeClassNames.danger,
      indicator: evaluationBadgeIndicators.danger,
    }
  }

  if (value === 'LOW') {
    return {
      label: '저평가',
      className: evaluationBadgeClassNames.safe,
      indicator: evaluationBadgeIndicators.safe,
    }
  }

  return {
    label: '적정',
    className: evaluationBadgeClassNames.neutral,
    indicator: evaluationBadgeIndicators.neutral,
  }
}

export function resolveThemeHeatBadge(value: string): {
  label: string
  className: string
  indicator: WatchlistBadgeIndicator
} {
  if (value === 'OVERHEATED') {
    return {
      label: '과열',
      className: evaluationBadgeClassNames.danger,
      indicator: evaluationBadgeIndicators.danger,
    }
  }

  if (value === 'COLD') {
    return {
      label: '냉각',
      className: evaluationBadgeClassNames.safe,
      indicator: evaluationBadgeIndicators.safe,
    }
  }

  return {
    label: '중립',
    className: evaluationBadgeClassNames.neutral,
    indicator: evaluationBadgeIndicators.neutral,
  }
}

export function resolveAiJudgmentBadge(value: string): {
  label: string
  className: string
  indicator: WatchlistBadgeIndicator
} {
  if (value === 'RISK_INCREASING') {
    return {
      label: '위험 증가',
      className: evaluationBadgeClassNames.danger,
      indicator: evaluationBadgeIndicators.danger,
    }
  }

  if (value === 'WATCH') {
    return {
      label: '관망',
      className: evaluationBadgeClassNames.warning,
      indicator: evaluationBadgeIndicators.warning,
    }
  }

  return {
    label: '안정',
    className: evaluationBadgeClassNames.safe,
    indicator: evaluationBadgeIndicators.safe,
  }
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
