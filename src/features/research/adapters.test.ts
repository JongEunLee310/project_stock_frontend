import { describe, expect, it } from 'vitest'

import { formatKstDateTime } from '@/shared/lib/format'

import {
  adaptNewsDisclosure,
  adaptPriceSeries,
  adaptResearchDetail,
  adaptResearchListRow,
  adaptThesis,
} from './adapters'
import type {
  AssetDetailDto,
  BuyChecklistDto,
  NewsDisclosureDto,
  ResearchSummaryDto,
  ThesisDto,
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

describe('research adapters', () => {
  it('combines an asset and research summary into a list row', () => {
    expect(adaptResearchListRow(detail, summary)).toEqual({
      assetId: 1,
      symbol: 'NVDA',
      name: 'NVIDIA Corp.',
      market: 'NASDAQ',
      sector: 'Technology',
      stanceLabel: '매수 후보',
      summaryUpdatedAt: formatKstDateTime(summary.created_at),
    })
  })

  it('keeps list asset data when its research summary is unavailable', () => {
    expect(adaptResearchListRow(detail, null)).toEqual({
      assetId: 1,
      symbol: 'NVDA',
      name: 'NVIDIA Corp.',
      market: 'NASDAQ',
      sector: 'Technology',
      stanceLabel: null,
      summaryUpdatedAt: null,
    })
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
      },
      { items: null },
      null,
    )

    expect(view.stance).toBe('판단 보류')
    expect(view.stanceConfidence).toBeNull()
    expect(view.stanceComment).toBeNull()
    expect(view.confidenceBasis).toBeNull()
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

  it('adapts price closes and metadata while filtering null close values', () => {
    expect(
      adaptPriceSeries({
        currency: 'USD',
        source: 'polygon',
        last_updated_at: '2026-07-10T00:00:00Z',
        bars: [{ close: '101.25' }, { close: null }, { close: '102.50' }],
      }),
    ).toEqual({
      closes: [101.25, 102.5],
      currency: 'USD',
      source: 'polygon',
      lastUpdatedAt: '2026-07-10T00:00:00Z',
    })

    expect(adaptPriceSeries({ bars: [] })).toEqual({
      closes: [],
      currency: null,
      source: null,
      lastUpdatedAt: null,
    })
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
})
