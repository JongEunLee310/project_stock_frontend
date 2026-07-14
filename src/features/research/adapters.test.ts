import { afterEach, describe, expect, it, vi } from 'vitest'

import { formatKstDateTime } from '@/shared/lib/format'

import {
  adaptBenchmarkComparison,
  adaptAssetEvents,
  adaptCatalystTimeline,
  adaptEarningsSummary,
  adaptNewsDisclosure,
  adaptPriceSeries,
  adaptResearchCoverage,
  adaptResearchDetail,
  toResearchQueueView,
  adaptThesis,
  adaptValuationMetrics,
  withMovingAverage,
  snapEventsToChartPoints,
} from './adapters'
import type {
  AssetDetailDto,
  AssetEventHistoryDto,
  BuyChecklistDto,
  CatalystTimelineDto,
  EarningsSummaryDto,
  NewsDisclosureDto,
  ResearchCoverageDto,
  ResearchQueueResponseDto,
  ResearchSummaryDto,
  ThesisDto,
  ValuationMetricsDto,
} from './dto'

const detail: AssetDetailDto = {
  id: 1,
  symbol: 'NVDA',
  name: 'NVIDIA Corp.',
  market: 'NASDAQ',
  sector: 'Technology',
  price: '142.62',
  previous_close: '140.11',
  change: '2.51',
  change_percent: '1.79145',
  currency: 'USD',
  market_cap: '2540000000000',
  per: '38.4',
  peg: '',
  fifty_two_week_low: '88.12',
  fifty_two_week_high: null,
  target_price: '1145.32',
  target_upside_percent: '11.8',
  next_earnings_date: '2026-08-20',
  updated_at: '2026-05-24T00:00:00.000Z',
}

afterEach(() => {
  vi.useRealTimers()
})

const summary: ResearchSummaryDto = {
  stance: 'BUY_CANDIDATE',
  stance_confidence: '0.72',
  stance_comment:
    '성장성과 현금흐름 개선을 확인하되 가격 부담을 함께 검토할 단계입니다.',
  headline: 'AI demand remains durable',
  body: 'Margins remain the key checkpoint.',
  positive_factors: ['매출 성장 지속', '현금흐름 개선'],
  caution_factors: ['밸류에이션 부담'],
  next_checks: ['다음 분기 마진 확인'],
  confidence_basis:
    '성장 지표는 긍정적이지만 밸류에이션 불확실성이 남아 있습니다.',
  counter_points: [
    {
      id: 'counter-valuation',
      claim: '높은 밸류에이션이 추가 상승 여력을 제한할 수 있습니다.',
      basis: '선행 PER이 5년 중앙값을 웃돕니다.',
      basis_type: 'VALUATION',
      strength: 'STRONG',
      source_label: '분기 실적 자료',
    },
  ],
  key_risks: [
    {
      id: 'risk-1',
      title: 'Margin pressure',
      level: 'MEDIUM',
      description: 'Gross margin normalization.',
      evidence: ['최근 분기 매출총이익률 하락'],
    },
  ],
  created_at: '2026-05-24T00:00:00.000Z',
}

const checklist: BuyChecklistDto = {
  memo: 'Wait for the next earnings call.',
  checked_item_keys: ['valuation'],
  items: [
    {
      id: 'valuation',
      label: 'Valuation',
      description: null,
      checked: false,
    },
    {
      id: 'portfolio_concentration',
      label: 'Portfolio concentration',
      checked: true,
    },
  ],
}

const thesis: ThesisDto = {
  id: 5,
  title: 'Latest thesis',
  summary: 'Track AI capex.',
  created_at: '2026-05-24T00:00:00.000Z',
}

const valuationMetrics: ValuationMetricsDto = {
  asset_id: 1,
  profile: 'DEFICIT',
  highlighted_metrics: ['PSR', 'FCF_YIELD'],
  metrics: [
    {
      metric: 'PER',
      value: null,
      five_year_median: null,
      percentile: null,
    },
    {
      metric: 'FORWARD_PER',
      value: '31.50',
      five_year_median: '28.20',
      percentile: 72,
    },
    {
      metric: 'PSR',
      value: '12.40',
      five_year_median: '10.10',
      percentile: 81,
    },
    {
      metric: 'PBR',
      value: '18.90',
      five_year_median: '15.70',
      percentile: 69,
    },
    {
      metric: 'EV_EBITDA',
      value: '24.30',
      five_year_median: '21.00',
      percentile: 65,
    },
    {
      metric: 'PEG',
      value: null,
      five_year_median: null,
      percentile: null,
    },
    {
      metric: 'FCF_YIELD',
      value: '2.75',
      five_year_median: '3.10',
      percentile: 35,
    },
  ],
}

const earningsSummary: EarningsSummaryDto = {
  asset_id: 1,
  quarters: [
    {
      period: '2025Q3',
      revenue: '35000000000.00',
      operating_income: '21000000000.00',
      eps: '0.81',
      revenue_yoy_percent: '93.60',
      operating_margin_percent: '60.00',
      eps_estimate: '0.75',
      eps_surprise_percent: '8.00',
    },
    {
      period: '2025Q4',
      revenue: '39300000000.00',
      operating_income: '24000000000.00',
      eps: '0.89',
      revenue_yoy_percent: null,
      operating_margin_percent: '61.10',
      eps_estimate: '0.92',
      eps_surprise_percent: '-3.26',
    },
  ],
  guidance: '다음 분기 매출은 시장 기대에 부합할 전망입니다.',
  segments: [
    {
      name: '데이터센터',
      revenue_share_percent: '88.25',
      yoy_growth_percent: '112.40',
    },
  ],
}

describe('research adapters', () => {
  it('adapts valuation labels, nulls, highlights, and decimal strings', () => {
    const result = adaptValuationMetrics(valuationMetrics)

    expect(result.profileLabel).toBe('적자 전환 관찰')
    expect(result.metrics.map((item) => item.metricLabel)).toEqual([
      'PER',
      'Forward PER',
      'PSR',
      'PBR',
      'EV/EBITDA',
      'PEG',
      'FCF 수익률',
    ])
    expect(result.metrics[0]).toMatchObject({
      value: null,
      fiveYearMedian: null,
      percentile: null,
      isHighlighted: false,
    })
    expect(result.metrics[2]).toMatchObject({
      value: 12.4,
      fiveYearMedian: 10.1,
      percentile: 81,
      isHighlighted: true,
    })
  })

  it('falls back to raw valuation metric and profile values', () => {
    const result = adaptValuationMetrics({
      ...valuationMetrics,
      profile: 'SPECIAL',
      highlighted_metrics: ['CUSTOM_RATIO'],
      metrics: [
        {
          metric: 'CUSTOM_RATIO',
          value: '1.25',
          five_year_median: '1.00',
          percentile: 50,
        },
      ],
    })

    expect(result.profileLabel).toBe('SPECIAL')
    expect(result.metrics[0]).toMatchObject({
      metricLabel: 'CUSTOM_RATIO',
      isHighlighted: true,
    })
  })

  it('adapts earnings decimal strings while preserving quarter order', () => {
    expect(adaptEarningsSummary(earningsSummary)).toEqual({
      quarters: [
        {
          period: '2025Q3',
          revenue: 35000000000,
          operatingIncome: 21000000000,
          eps: 0.81,
          revenueYoyPercent: 93.6,
          operatingMarginPercent: 60,
          epsEstimate: 0.75,
          epsSurprisePercent: 8,
        },
        {
          period: '2025Q4',
          revenue: 39300000000,
          operatingIncome: 24000000000,
          eps: 0.89,
          revenueYoyPercent: null,
          operatingMarginPercent: 61.1,
          epsEstimate: 0.92,
          epsSurprisePercent: -3.26,
        },
      ],
      guidance: '다음 분기 매출은 시장 기대에 부합할 전망입니다.',
      segments: [
        {
          name: '데이터센터',
          revenueSharePercent: 88.25,
          yoyGrowthPercent: 112.4,
        },
      ],
    })
  })

  it('maps research queue summary, status, stance, and timestamps', () => {
    const dto: ResearchQueueResponseDto = {
      summary: {
        total_research_count: 3,
        needs_attention_count: 1,
        updated_today_count: 2,
        insufficient_count: 1,
      },
      items: [
        {
          asset_id: 1,
          symbol: 'NVDA',
          name: 'NVIDIA Corp.',
          market: 'NASDAQ',
          research_status: 'NEEDS_ATTENTION',
          completeness_pct: 75,
          stance: 'BUY_CANDIDATE',
          headline: 'AI demand remains durable',
          key_issue: '밸류에이션 부담을 확인해야 합니다.',
          last_updated_at: '2026-07-13T01:20:00Z',
          signal_type: 'RISK_ALERT',
        },
      ],
    }

    expect(toResearchQueueView(dto, { page: 1, size: 20, total: 1 })).toEqual({
      summary: {
        totalResearchCount: 3,
        needsAttentionCount: 1,
        updatedTodayCount: 2,
        insufficientCount: 1,
      },
      items: [
        {
          assetId: 1,
          symbol: 'NVDA',
          name: 'NVIDIA Corp.',
          market: 'NASDAQ',
          researchStatusLabel: '추가 확인 필요',
          researchStatusTone: 'danger',
          completenessPct: 75,
          stanceLabel: '매수 후보',
          headline: 'AI demand remains durable',
          keyIssue: '밸류에이션 부담을 확인해야 합니다.',
          lastUpdatedAt: formatKstDateTime('2026-07-13T01:20:00Z'),
          signalType: 'RISK_ALERT',
        },
      ],
      meta: { page: 1, size: 20, total: 1 },
    })
  })

  it('falls back safely for an unknown research status and null update time', () => {
    const dto: ResearchQueueResponseDto = {
      summary: {
        total_research_count: 1,
        needs_attention_count: 0,
        updated_today_count: 0,
        insufficient_count: 0,
      },
      items: [
        {
          asset_id: 2,
          symbol: 'TSLA',
          name: 'Tesla, Inc.',
          market: 'NASDAQ',
          research_status: 'UNKNOWN_STATUS',
          completeness_pct: 120,
          stance: null,
          headline: null,
          key_issue: null,
          last_updated_at: null,
          signal_type: null,
        },
      ],
    }

    expect(
      toResearchQueueView(dto, { page: 1, size: 20, total: 1 }).items[0],
    ).toMatchObject({
      researchStatusLabel: '—',
      researchStatusTone: 'neutral',
      completenessPct: 100,
      stanceLabel: null,
      lastUpdatedAt: null,
    })
  })

  it.each([
    ['NEEDS_ATTENTION', '추가 확인 필요', 'danger'],
    ['INSUFFICIENT', '데이터 부족', 'neutral'],
    ['COLLECTING', '수집 중', 'info'],
    ['PENDING_ANALYSIS', '분석 대기', 'neutral'],
    ['STALE', '오래됨', 'warning'],
    ['ANALYZED', '분석 완료', 'success'],
  ] as const)('maps research status %s to %s', (status, label, tone) => {
    const dto: ResearchQueueResponseDto = {
      summary: {
        total_research_count: 1,
        needs_attention_count: 0,
        updated_today_count: 0,
        insufficient_count: 0,
      },
      items: [
        {
          asset_id: 1,
          symbol: 'NVDA',
          name: 'NVIDIA Corp.',
          market: 'NASDAQ',
          research_status: status,
          completeness_pct: 50,
          stance: null,
          headline: null,
          key_issue: null,
          last_updated_at: null,
          signal_type: null,
        },
      ],
    }

    expect(
      toResearchQueueView(dto, { page: 1, size: 20, total: 1 }).items[0],
    ).toMatchObject({ researchStatusLabel: label, researchStatusTone: tone })
  })

  it('combines detail, summary, checklist, and thesis', () => {
    const view = adaptResearchDetail(detail, summary, checklist, thesis)

    expect(view).toMatchObject({
      assetId: 1,
      symbol: 'NVDA',
      name: 'NVIDIA Corp.',
      market: 'NASDAQ',
      price: 142.62,
      change: 2.51,
      changePercent: 1.79145,
      currency: 'USD',
      marketCap: 2540000000000,
      per: 38.4,
      peg: null,
      fiftyTwoWeekHigh: null,
      targetPrice: 1145.32,
      targetUpsidePercent: 11.8,
      stance: '매수 후보',
      stanceConfidence: 72,
      stanceComment:
        '성장성과 현금흐름 개선을 확인하되 가격 부담을 함께 검토할 단계입니다.',
      confidenceBasis:
        '성장 지표는 긍정적이지만 밸류에이션 불확실성이 남아 있습니다.',
      briefing: {
        headline: 'AI demand remains durable',
        body: 'Margins remain the key checkpoint.',
        positiveFactors: ['매출 성장 지속', '현금흐름 개선'],
        cautionFactors: ['밸류에이션 부담'],
        nextChecks: ['다음 분기 마진 확인'],
        createdAt: formatKstDateTime(summary.created_at),
      },
      checklistMemo: 'Wait for the next earnings call.',
    })
    expect(view).not.toHaveProperty('priceSparkline')
    expect(view.counterPoints).toEqual([
      {
        id: 'counter-valuation',
        claim: '높은 밸류에이션이 추가 상승 여력을 제한할 수 있습니다.',
        basis: '선행 PER이 5년 중앙값을 웃돕니다.',
        basisTypeLabel: '밸류에이션',
        strength: 'STRONG',
        sourceLabel: '분기 실적 자료',
      },
    ])
    expect(view.keyRisks[0].level).toBe('중간')
    expect(view.keyRisks[0].evidence).toEqual(['최근 분기 매출총이익률 하락'])
    expect(view.buyChecklist[0]).toMatchObject({
      id: 'valuation',
      description: '',
      checked: true,
    })
    expect(view.buyChecklist[1].checked).toBe(false)
    expect(view.latestThesis?.title).toBe('Latest thesis')
  })

  it('supports null thesis and empty nested collections', () => {
    const view = adaptResearchDetail(
      detail,
      {
        ...summary,
        stance: 'UNKNOWN',
        key_risks: null,
        stance_confidence: null,
        stance_comment: null,
        positive_factors: null,
        caution_factors: null,
        next_checks: null,
        confidence_basis: null,
        counter_points: null,
      },
      { items: null },
      null,
    )

    expect(view.stance).toBe('판단 보류')
    expect(view.stanceConfidence).toBeNull()
    expect(view.stanceComment).toBeNull()
    expect(view.confidenceBasis).toBeNull()
    expect(view.counterPoints).toEqual([])
    expect(view.briefing.positiveFactors).toEqual([])
    expect(view.briefing.cautionFactors).toEqual([])
    expect(view.briefing.nextChecks).toEqual([])
    expect(view.keyRisks).toEqual([])
    expect(view.buyChecklist).toEqual([])
    expect(view.checklistMemo).toBeNull()
    expect(view.latestThesis).toBeNull()
    expect(view).not.toHaveProperty('priceSparkline')
  })

  it('uses empty structured fields for legacy summaries', () => {
    const view = adaptResearchDetail(
      detail,
      {
        stance: summary.stance,
        stance_confidence: summary.stance_confidence,
        headline: summary.headline,
        body: summary.body,
        key_risks: [
          {
            title: 'Legacy risk',
            level: 'LOW',
            description: 'Legacy risk description.',
          },
        ],
        created_at: summary.created_at,
      },
      checklist,
      null,
    )

    expect(view.stanceComment).toBeNull()
    expect(view.confidenceBasis).toBeNull()
    expect(view.counterPoints).toEqual([])
    expect(view.briefing.positiveFactors).toEqual([])
    expect(view.briefing.cautionFactors).toEqual([])
    expect(view.briefing.nextChecks).toEqual([])
    expect(view.keyRisks[0].evidence).toEqual([])
  })

  it.each([
    ['null', { ...checklist, checked_item_keys: null }],
    [
      'missing',
      {
        memo: checklist.memo,
        items: checklist.items,
      },
    ],
  ])(
    'falls back to item checked values when checked_item_keys is %s',
    (_case, checklistWithoutCheckedKeys) => {
      const view = adaptResearchDetail(
        detail,
        summary,
        checklistWithoutCheckedKeys,
        null,
      )

      expect(
        view.buyChecklist.map(({ id, checked }) => ({ id, checked })),
      ).toEqual([
        { id: 'valuation', checked: false },
        { id: 'portfolio_concentration', checked: true },
      ])
    },
  )

  it('maps missing market to null', () => {
    const view = adaptResearchDetail(
      { ...detail, market: undefined },
      summary,
      checklist,
      null,
    )

    expect(view.market).toBeNull()
  })

  it('maps nullable price fields to null', () => {
    const view = adaptResearchDetail(
      {
        ...detail,
        price: null,
        change: undefined,
        change_percent: '',
        currency: null,
      },
      summary,
      checklist,
      null,
    )

    expect(view).toMatchObject({
      price: null,
      change: null,
      changePercent: null,
      currency: null,
    })
  })

  it('adapts price points and metadata while filtering null close values', () => {
    expect(
      adaptPriceSeries({
        currency: 'USD',
        source: 'polygon',
        last_updated_at: '2026-07-10T00:00:00Z',
        bars: [
          { date: '2026-07-08', close: '101.25', volume: 1200 },
          { date: '2026-07-09', close: null, volume: 1300 },
          { date: '2026-07-10', close: '102.50', volume: null },
        ],
      }),
    ).toEqual({
      closes: [101.25, 102.5],
      points: [
        {
          date: '2026-07-08',
          close: 101.25,
          volume: 1200,
          ma20: null,
        },
        {
          date: '2026-07-10',
          close: 102.5,
          volume: null,
          ma20: null,
        },
      ],
      currency: 'USD',
      source: 'polygon',
      lastUpdatedAt: '2026-07-10T00:00:00Z',
    })

    expect(adaptPriceSeries({ bars: [] })).toEqual({
      closes: [],
      points: [],
      currency: null,
      source: null,
      lastUpdatedAt: null,
    })
  })

  it('derives MA20 only after the twentieth close', () => {
    const points = Array.from({ length: 21 }, (_, index) => ({
      date: `2026-06-${String(index + 1).padStart(2, '0')}`,
      close: index + 1,
      volume: null,
    }))

    const result = withMovingAverage(points)

    expect(result.slice(0, 19).every((point) => point.ma20 === null)).toBe(true)
    expect(result[19].ma20).toBe(10.5)
    expect(result[20].ma20).toBe(11.5)
  })

  it('adapts benchmark returns while preserving response order', () => {
    const result = adaptBenchmarkComparison({
      series: [
        {
          kind: 'ASSET',
          label: 'NVDA',
          points: [
            { date: '2026-06-01', return_percent: '0' },
            { date: '2026-06-02', return_percent: '1.25' },
            { date: '2026-06-03', return_percent: 'invalid' },
          ],
        },
        {
          kind: 'INDEX',
          label: 'NASDAQ 100',
          points: [{ date: '2026-06-01', return_percent: '0' }],
        },
        {
          kind: 'SECTOR_ETF',
          label: 'Technology Select Sector SPDR Fund',
          points: [{ date: '2026-06-01', return_percent: '0' }],
        },
      ],
    })

    expect(result.map((series) => series.kind)).toEqual([
      'ASSET',
      'INDEX',
      'SECTOR_ETF',
    ])
    expect(result[0].points).toEqual([
      { date: '2026-06-01', returnPercent: 0 },
      { date: '2026-06-02', returnPercent: 1.25 },
    ])
  })

  it('adapts asset event decimals and omits unavailable label details', () => {
    const dto: AssetEventHistoryDto = {
      asset_id: detail.id,
      range: '3M',
      events: [
        {
          event_date: '2026-05-21',
          event_type: 'EARNINGS',
          eps_actual: null,
          eps_estimate: null,
          eps_surprise_percent: null,
        },
        {
          event_date: '2026-06-18',
          event_type: 'EARNINGS',
          eps_actual: '1.52',
          eps_estimate: null,
          eps_surprise_percent: '-2.70',
        },
        {
          event_date: '2026-07-10',
          event_type: 'EARNINGS',
          eps_actual: '1.52',
          eps_estimate: '1.48',
          eps_surprise_percent: '2.70',
        },
      ],
    }

    const events = adaptAssetEvents(dto)

    // BE #282의 Decimal 문자열 픽스처를 number로 변환한 기대값이다.
    expect(events[1]).toMatchObject({
      eventDate: '2026-06-18',
      eventType: 'EARNINGS',
      epsActual: 1.52,
      epsEstimate: null,
      epsSurprisePercent: -2.7,
      label: '06.18 실적 발표 · EPS 1.52 (서프라이즈 -2.70%)',
    })
    expect(events.map((event) => event.label)).toEqual([
      '05.21 실적 발표',
      '06.18 실적 발표 · EPS 1.52 (서프라이즈 -2.70%)',
      '07.10 실적 발표 · EPS 1.52 (예상 1.48, 서프라이즈 +2.70%)',
    ])
  })

  it('snaps events to the nearest previous chart date and keeps overlaps', () => {
    const events = adaptAssetEvents({
      asset_id: detail.id,
      range: '1M',
      events: [
        {
          event_date: '2026-07-01',
          event_type: 'EARNINGS',
          eps_actual: null,
          eps_estimate: null,
          eps_surprise_percent: null,
        },
        {
          event_date: '2026-07-05',
          event_type: 'EARNINGS',
          eps_actual: '1.2',
          eps_estimate: null,
          eps_surprise_percent: null,
        },
        {
          event_date: '2026-07-06',
          event_type: 'EARNINGS',
          eps_actual: null,
          eps_estimate: '1.1',
          eps_surprise_percent: null,
        },
        {
          event_date: '2026-07-06',
          event_type: 'EARNINGS',
          eps_actual: null,
          eps_estimate: null,
          eps_surprise_percent: '-1.5',
        },
      ],
    })
    const points = [
      { date: '2026-07-02', close: 100 },
      { date: '2026-07-03', close: 101 },
      { date: '2026-07-06', close: 105 },
    ]

    const markers = snapEventsToChartPoints(events, points)

    // 위 가격 픽스처의 거래일 종가를 그대로 기대한다.
    expect(markers.map(({ x, y }) => ({ x, y }))).toEqual([
      { x: '2026-07-03', y: 101 },
      { x: '2026-07-06', y: 105 },
      { x: '2026-07-06', y: 105 },
    ])
    expect(markers[0].label).toBe(events[1].label)
  })

  it('keeps stance and confidence fallbacks for null or invalid wire values', () => {
    const view = adaptResearchDetail(
      detail,
      { ...summary, stance: null, stance_confidence: 'not-a-number' },
      checklist,
      null,
    )

    expect(view.stance).toBe('판단 보류')
    expect(view.stanceConfidence).toBeNull()
  })

  it('maps thesis date-bearing DTOs', () => {
    expect(adaptThesis(thesis).id).toBe('5')
  })

  it('normalizes news and disclosure metadata and maps known labels', () => {
    const dto: NewsDisclosureDto = {
      asset_id: 1,
      news: [
        {
          id: 17,
          title: 'New accelerator announced',
          url: 'https://example.com/news/17',
          source: 'Example News',
          published_at: '2026-07-10T00:00:00Z',
          summary: 'A new product cycle begins.',
          category: ' product ',
          impact_level: 'medium',
          sentiment: 'positive',
        },
      ],
      disclosures: [
        {
          title: 'Quarterly filing',
          url: 'https://example.com/disclosures/quarterly',
          source: 'DART',
          published_at: null,
          category: 'OTHER',
        },
      ],
    }

    expect(adaptNewsDisclosure(dto)).toEqual({
      news: [
        {
          id: '17',
          title: 'New accelerator announced',
          url: 'https://example.com/news/17',
          source: 'Example News',
          publishedAt: formatKstDateTime('2026-07-10T00:00:00Z'),
          summary: 'A new product cycle begins.',
          categoryLabel: '제품',
          impactLabel: '중간',
          sentiment: 'POSITIVE',
        },
      ],
      disclosures: [
        {
          id: 'https://example.com/disclosures/quarterly',
          title: 'Quarterly filing',
          url: 'https://example.com/disclosures/quarterly',
          source: 'DART',
          publishedAt: null,
          summary: null,
          categoryLabel: '기타',
          impactLabel: null,
          sentiment: null,
        },
      ],
    })
  })

  it('maps unknown and nullable news metadata to null', () => {
    const view = adaptNewsDisclosure({
      asset_id: 1,
      news: [
        {
          id: 18,
          title: 'Unclassified item',
          url: 'https://example.com/news/18',
          source: 'Example News',
          category: 'UNKNOWN',
          impact_level: null,
          sentiment: 'mixed',
        },
      ],
      disclosures: [],
    })

    expect(view.news[0]).toMatchObject({
      publishedAt: null,
      summary: null,
      categoryLabel: null,
      impactLabel: null,
      sentiment: null,
    })
  })

  it('maps catalyst labels, date formats, and composite keys', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-11T00:00:00Z'))
    const eventTypes = [
      ['EARNINGS', '실적'],
      ['PRODUCT', '제품'],
      ['SHAREHOLDER_MEETING', '주주총회'],
      ['DIVIDEND', '배당'],
      ['REGULATORY', '규제'],
      ['CONTRACT', '계약'],
      ['LOCKUP', '락업 해제'],
      ['CONFERENCE', '콘퍼런스'],
      ['ECONOMIC', '경제지표'],
      ['OTHER', '기타'],
      ['UNKNOWN', '기타'],
    ] as const
    const dto: CatalystTimelineDto = {
      asset_id: 7,
      events: eventTypes.map(([eventType], index) => ({
        event_date: index === 1 ? '2027-08-09' : '2026-07-23',
        title: `Event ${index}`,
        event_type: eventType,
        is_estimated: index === 0,
      })),
    }

    const events = adaptCatalystTimeline(dto)

    expect(events.map((event) => event.typeLabel)).toEqual(
      eventTypes.map(([, label]) => label),
    )
    expect(events[0]).toMatchObject({
      key: '2026-07-23:EARNINGS:0',
      dateLabel: '07.23',
      isEstimated: true,
    })
    expect(events[1]).toMatchObject({
      key: '2027-08-09:PRODUCT:1',
      dateLabel: '2027.08.09',
      isEstimated: false,
    })
    expect(new Set(events.map((event) => event.key)).size).toBe(events.length)
  })

  it('maps research coverage labels, timestamps, and collection status', () => {
    const dto: ResearchCoverageDto = {
      asset_id: 1,
      axes: [
        {
          axis: 'NEWS',
          status: 'COLLECTED',
          last_updated_at: '2026-07-10T00:00:00Z',
          item_count: 12,
        },
        {
          axis: 'PRICE',
          status: 'COLLECTED',
          last_updated_at: '2026-07-10T01:00:00Z',
          item_count: 30,
        },
        {
          axis: 'EARNINGS',
          status: 'NOT_COLLECTED',
          last_updated_at: null,
          item_count: 0,
        },
        {
          axis: 'VALUATION',
          status: 'NOT_COLLECTED',
          last_updated_at: null,
          item_count: 0,
        },
        {
          axis: 'DISCLOSURE',
          status: 'NOT_COLLECTED',
          last_updated_at: null,
          item_count: 0,
        },
      ],
    }

    expect(adaptResearchCoverage(dto)).toEqual([
      {
        axis: 'NEWS',
        axisLabel: '뉴스',
        isCollected: true,
        lastUpdatedAt: formatKstDateTime('2026-07-10T00:00:00Z'),
        itemCount: 12,
      },
      {
        axis: 'PRICE',
        axisLabel: '가격',
        isCollected: true,
        lastUpdatedAt: formatKstDateTime('2026-07-10T01:00:00Z'),
        itemCount: 30,
      },
      {
        axis: 'EARNINGS',
        axisLabel: '실적',
        isCollected: false,
        lastUpdatedAt: null,
        itemCount: 0,
      },
      {
        axis: 'VALUATION',
        axisLabel: '밸류에이션',
        isCollected: false,
        lastUpdatedAt: null,
        itemCount: 0,
      },
      {
        axis: 'DISCLOSURE',
        axisLabel: '공시',
        isCollected: false,
        lastUpdatedAt: null,
        itemCount: 0,
      },
    ])
  })

  it('falls back to the raw axis label for unknown coverage axes', () => {
    expect(
      adaptResearchCoverage({
        asset_id: 1,
        axes: [
          {
            axis: 'ALTERNATIVE_DATA',
            status: 'NOT_COLLECTED',
            last_updated_at: null,
            item_count: 0,
          },
        ],
      }),
    ).toEqual([
      {
        axis: 'ALTERNATIVE_DATA',
        axisLabel: 'ALTERNATIVE_DATA',
        isCollected: false,
        lastUpdatedAt: null,
        itemCount: 0,
      },
    ])
  })

  it.each([
    ['VALUATION', '밸류에이션'],
    ['FUNDAMENTALS', '펀더멘털'],
    ['COMPETITION', '경쟁'],
    ['MACRO', '매크로'],
    ['SENTIMENT', '심리'],
  ] as const)('maps counter point basis type %s to %s', (basisType, label) => {
    const view = adaptResearchDetail(
      detail,
      {
        ...summary,
        counter_points: [
          {
            id: basisType,
            claim: '반대 주장',
            basis: '반대 근거',
            basis_type: basisType,
            strength: 'MODERATE',
            source_label: null,
          },
        ],
      },
      checklist,
      null,
    )

    expect(view.counterPoints[0]).toMatchObject({
      basisTypeLabel: label,
      strength: 'MODERATE',
      sourceLabel: null,
    })
  })

  it('preserves an unknown counter point basis type and drops an unknown strength', () => {
    const summaryWithUnknownCounterPoint = {
      ...summary,
      counter_points: [
        {
          id: 'counter-unknown',
          claim: '반대 주장',
          basis: '반대 근거',
          basis_type: 'REGULATION',
          strength: 'VERY_STRONG',
          source_label: null,
        },
      ],
    } as unknown as ResearchSummaryDto

    expect(
      adaptResearchDetail(
        detail,
        summaryWithUnknownCounterPoint,
        checklist,
        null,
      ).counterPoints[0],
    ).toMatchObject({
      basisTypeLabel: 'REGULATION',
      strength: null,
    })
  })
})
