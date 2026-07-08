import { describe, expect, it } from 'vitest'

import {
  adaptWatchlistEvaluations,
  adaptWatchlistAsset,
  adaptWatchlistSummary,
  adaptWatchlistSummaryTrends,
  getWatchlistTrendCounts,
  resolveAiJudgmentBadge,
  resolveNewsRiskBadge,
  resolveStatusBadge,
  resolveThemeHeatBadge,
  resolveValuationBadge,
} from './adapters'
import type {
  WatchlistEvaluationsResponseDto,
  WatchlistItemDto,
  WatchlistSummaryDto,
  WatchlistTrendSeriesDto,
} from './dto'

const itemDto: WatchlistItemDto = {
  id: 1,
  watchlist_id: 1,
  asset_id: 1,
  priority: 10,
  reason: 'Core AI exposure',
  tags: ['ai', 'large-cap'],
  memo: 'Watch earnings.',
  created_at: '2026-06-19T00:00:00Z',
  status: 'NORMAL', // app/domains/signals/types.py:4-13
  asset: {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    market: 'NASDAQ',
    price: '195.64',
    change_percent: '1.26',
    sector: 'Technology',
    currency: 'USD',
    reference_at: '2026-06-20T00:00:00Z',
  },
}

describe('adaptWatchlistAsset', () => {
  it('maps expanded asset item into a thin watchlist row', () => {
    expect(adaptWatchlistAsset(itemDto)).toEqual({
      id: 1,
      symbol: 'AAPL',
      market: 'NASDAQ',
      name: 'Apple Inc.',
      price: 195.64,
      changePercent: 1.26,
      currency: 'USD',
      sector: 'Technology',
      reason: 'Core AI exposure',
      tags: ['ai', 'large-cap'],
      memo: 'Watch earnings.',
      status: 'NORMAL',
      referenceAt: '2026-06-20T00:00:00Z',
    })
    expect(adaptWatchlistAsset(itemDto)).not.toHaveProperty('createdAt')
  })

  it('skips items when expand=asset was not provided', () => {
    expect(adaptWatchlistAsset({ ...itemDto, asset: undefined })).toBeNull()
  })

  it('keeps parseDecimal null boundaries and falls back unknown sector', () => {
    expect(
      adaptWatchlistAsset({
        ...itemDto,
        asset: {
          ...itemDto.asset!,
          price: '',
          change_percent: null,
          sector: null,
        },
      }),
    ).toMatchObject({
      price: null,
      changePercent: null,
      sector: 'UNKNOWN',
    })
  })

  it('falls back to null currency when the backend omits the field', () => {
    const asset = { ...itemDto.asset! }
    delete asset.currency

    expect(adaptWatchlistAsset({ ...itemDto, asset })).toMatchObject({
      currency: null,
    })
  })

  it('falls back to UNKNOWN market when the backend omits the field', () => {
    const asset = { ...itemDto.asset! }
    delete asset.market

    expect(adaptWatchlistAsset({ ...itemDto, asset })).toMatchObject({
      market: 'UNKNOWN',
    })
  })
})

describe('resolveStatusBadge', () => {
  it.each([
    [
      'NORMAL',
      {
        label: '안정',
        className: 'bg-emerald-500/10 text-emerald-300',
        dotClassName: 'bg-emerald-400',
      },
    ],
    [
      'WATCH',
      {
        label: '관망',
        className: 'bg-amber-500/10 text-amber-300',
        dotClassName: 'bg-amber-400',
      },
    ],
    [
      'BUY_CANDIDATE',
      {
        label: '관망',
        className: 'bg-amber-500/10 text-amber-300',
        dotClassName: 'bg-amber-400',
      },
    ],
    [
      'RISK_ALERT',
      {
        label: '위험 증가',
        className: 'bg-rose-500/10 text-rose-300',
        dotClassName: 'bg-rose-400',
      },
    ],
    [
      'THESIS_BROKEN',
      {
        label: '위험 증가',
        className: 'bg-rose-500/10 text-rose-300',
        dotClassName: 'bg-rose-400',
      },
    ],
    [
      'SELL_REVIEW',
      {
        label: '위험 증가',
        className: 'bg-rose-500/10 text-rose-300',
        dotClassName: 'bg-rose-400',
      },
    ],
    [
      'OVERHEATED',
      {
        label: '위험 증가',
        className: 'bg-rose-500/10 text-rose-300',
        dotClassName: 'bg-rose-400',
      },
    ],
    // app/domains/signals/types.py:4-13
  ] as const)('maps %s to %s', (status, expectedBadge) => {
    expect(resolveStatusBadge(status)).toEqual(expectedBadge)
  })

  it('falls back to stable for an unknown status', () => {
    expect(resolveStatusBadge('UNKNOWN')).toEqual({
      label: '안정',
      className: 'bg-emerald-500/10 text-emerald-300',
      dotClassName: 'bg-emerald-400',
    })
  })
})

describe('watchlist evaluation badge resolvers', () => {
  it.each([
    ['HIGH', '높음', 'bg-rose-500/10 text-rose-300', 'bg-rose-400'],
    ['MEDIUM', '중간', 'bg-amber-500/10 text-amber-300', 'bg-amber-400'],
    ['LOW', '낮음', 'bg-emerald-500/10 text-emerald-300', 'bg-emerald-400'],
    ['UNKNOWN', '중간', 'bg-slate-500/10 text-slate-300', 'bg-slate-400'],
    // app/domains/watchlists/types.py
  ] as const)(
    'maps news risk %s to %s',
    (value, label, className, dotClassName) => {
      expect(resolveNewsRiskBadge(value)).toEqual({
        label,
        className,
        dotClassName,
      })
    },
  )

  it.each([
    ['HIGH', '고평가', 'bg-rose-500/10 text-rose-300', 'bg-rose-400'],
    ['MODERATE', '적정', 'bg-slate-500/10 text-slate-300', 'bg-slate-400'],
    ['LOW', '저평가', 'bg-emerald-500/10 text-emerald-300', 'bg-emerald-400'],
    ['UNKNOWN', '적정', 'bg-slate-500/10 text-slate-300', 'bg-slate-400'],
    // app/domains/watchlists/types.py
  ] as const)(
    'maps valuation burden %s to %s',
    (value, label, className, dotClassName) => {
      expect(resolveValuationBadge(value)).toEqual({
        label,
        className,
        dotClassName,
      })
    },
  )

  it.each([
    ['OVERHEATED', '과열', 'bg-rose-500/10 text-rose-300', 'bg-rose-400'],
    ['NEUTRAL', '중립', 'bg-slate-500/10 text-slate-300', 'bg-slate-400'],
    ['COLD', '냉각', 'bg-emerald-500/10 text-emerald-300', 'bg-emerald-400'],
    ['UNKNOWN', '중립', 'bg-slate-500/10 text-slate-300', 'bg-slate-400'],
    // app/domains/watchlists/types.py
  ] as const)(
    'maps theme heat %s to %s',
    (value, label, className, dotClassName) => {
      expect(resolveThemeHeatBadge(value)).toEqual({
        label,
        className,
        dotClassName,
      })
    },
  )

  it.each([
    [
      'RISK_INCREASING',
      '위험 증가',
      'bg-rose-500/10 text-rose-300',
      'bg-rose-400',
    ],
    ['WATCH', '관망', 'bg-amber-500/10 text-amber-300', 'bg-amber-400'],
    ['STABLE', '안정', 'bg-emerald-500/10 text-emerald-300', 'bg-emerald-400'],
    ['UNKNOWN', '안정', 'bg-emerald-500/10 text-emerald-300', 'bg-emerald-400'],
    // app/domains/watchlists/types.py
  ] as const)(
    'maps AI judgment %s to %s',
    (value, label, className, dotClassName) => {
      expect(resolveAiJudgmentBadge(value)).toEqual({
        label,
        className,
        dotClassName,
      })
    },
  )
})

describe('adaptWatchlistEvaluations', () => {
  it('maps evaluation items into a symbol keyed record', () => {
    const dto: WatchlistEvaluationsResponseDto = {
      generated_at: '2026-07-08T00:00:00Z',
      needs_research_count: 2,
      items: [
        {
          symbol: 'NVDA',
          news_risk: 'HIGH', // app/domains/watchlists/types.py
          valuation_burden: 'HIGH', // app/domains/watchlists/types.py
          theme_heat: 'OVERHEATED', // app/domains/watchlists/types.py
          ai_judgment: 'RISK_INCREASING', // app/domains/watchlists/types.py
        },
        {
          symbol: 'AAPL',
          news_risk: 'LOW',
          valuation_burden: 'MODERATE',
          theme_heat: 'NEUTRAL',
          ai_judgment: 'STABLE',
        },
      ],
    }

    const result = adaptWatchlistEvaluations(dto)

    expect(result.needsResearchCount).toBe(2)
    expect(result.map.NVDA).toMatchObject({
      symbol: 'NVDA',
      newsRisk: 'HIGH',
      valuationBurden: 'HIGH',
      themeHeat: 'OVERHEATED',
      aiJudgment: 'RISK_INCREASING',
    })
    expect(result.map.AAPL).toMatchObject({
      symbol: 'AAPL',
      newsRisk: 'LOW',
    })
    expect(result.map.TSLA).toBeUndefined()
  })
})

describe('adaptWatchlistSummary', () => {
  const summaryDto: WatchlistSummaryDto = {
    total_count: 12,
    risk_increasing_count: 3,
    recent_items: [
      {
        symbol: 'NVDA',
        name: 'NVIDIA Corp.',
        created_at: '2026-06-20T03:00:00Z',
      },
    ],
    buy_readiness: {
      level: 'LIMITED', // app/domains/watchlists/types.py
      level_label: '제한적',
      cash_weight: '0.12',
      buy_candidate_count: 1,
      message: '현금 비중이 낮아 신규 매수 여력이 제한적입니다.',
    },
  }

  it('maps watchlist summary and recent additions', () => {
    expect(adaptWatchlistSummary(summaryDto)).toEqual({
      totalCount: 12,
      riskIncreasingCount: 3,
      recentItems: [
        {
          symbol: 'NVDA',
          name: 'NVIDIA Corp.',
          addedAt: '2026-06-20T03:00:00Z',
        },
      ],
      buyReadiness: {
        level: 'LIMITED',
        levelLabel: '제한적',
        cashWeight: 0.12,
        buyCandidateCount: 1,
        message: '현금 비중이 낮아 신규 매수 여력이 제한적입니다.',
      },
    })
  })

  it('falls back to an empty recent item list', () => {
    expect(
      adaptWatchlistSummary({
        total_count: 0,
        risk_increasing_count: 0,
      }),
    ).toEqual({
      totalCount: 0,
      riskIncreasingCount: 0,
      recentItems: [],
      buyReadiness: null,
    })
  })

  it('maps null buy readiness as null', () => {
    expect(
      adaptWatchlistSummary({
        ...summaryDto,
        buy_readiness: null,
      }).buyReadiness,
    ).toBeNull()
  })
})

describe('watchlist summary trends adapters', () => {
  const trendsDto: WatchlistTrendSeriesDto = {
    days: 14,
    series: [
      {
        key: 'watchlist_total',
        data: [
          { date: '2026-06-29', count: 0 },
          { date: '2026-06-30', count: 12 },
        ],
      },
      {
        key: 'risk_increasing',
        data: [
          { date: '2026-06-29', count: 1 },
          { date: '2026-06-30', count: 3 },
        ],
      },
      {
        key: 'empty_series',
        data: [],
      },
    ],
  }

  it('extracts watchlist total count series', () => {
    expect(getWatchlistTrendCounts(trendsDto, 'watchlist_total')).toEqual([
      0, 12,
    ])
  })

  it('extracts risk increasing count series', () => {
    expect(getWatchlistTrendCounts(trendsDto, 'risk_increasing')).toEqual([
      1, 3,
    ])
  })

  it('returns an empty array for a missing key', () => {
    expect(getWatchlistTrendCounts(trendsDto, 'missing')).toEqual([])
  })

  it('returns an empty array for an empty series', () => {
    expect(getWatchlistTrendCounts(trendsDto, 'empty_series')).toEqual([])
  })

  it('preserves zero-filled points', () => {
    expect(getWatchlistTrendCounts(trendsDto, 'watchlist_total')[0]).toBe(0)
  })

  it('maps summary trend series into the view shape', () => {
    expect(adaptWatchlistSummaryTrends(trendsDto)).toEqual({
      watchlistTotal: [0, 12],
      riskIncreasing: [1, 3],
    })
  })
})
