import { describe, expect, it } from 'vitest'

import {
  adaptPriceSeries,
  adaptReport,
  adaptResearchDetail,
  adaptThesis,
} from './adapters'
import type {
  AssetDetailDto,
  BuyChecklistDto,
  ReportDto,
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
  headline: 'AI demand remains durable',
  body: 'Margins remain the key checkpoint.',
  key_risks: [
    {
      id: 'risk-1',
      title: 'Margin pressure',
      level: 'MEDIUM',
      description: 'Gross margin normalization.',
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

const report: ReportDto = {
  id: 4,
  title: 'Quarterly note',
  source: 'Internal',
  summary: null,
  created_at: '2026-05-24T00:00:00.000Z',
}

const thesis: ThesisDto = {
  id: 5,
  title: 'Latest thesis',
  summary: 'Track AI capex.',
  created_at: '2026-05-24T00:00:00.000Z',
}

describe('research adapters', () => {
  it('combines detail, summary, checklist, reports, and thesis', () => {
    const view = adaptResearchDetail(
      detail,
      summary,
      checklist,
      [report],
      thesis,
    )

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
      checklistMemo: 'Wait for the next earnings call.',
    })
    expect(view).not.toHaveProperty('priceSparkline')
    expect(view.keyRisks[0].level).toBe('중간')
    expect(view.buyChecklist[0]).toMatchObject({
      id: 'valuation',
      description: '',
      checked: true,
    })
    expect(view.buyChecklist[1].checked).toBe(false)
    expect(view.reports[0].summary).toBeNull()
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
      },
      { items: null },
      [],
      null,
    )

    expect(view.stance).toBe('판단 보류')
    expect(view.stanceConfidence).toBeNull()
    expect(view.keyRisks).toEqual([])
    expect(view.buyChecklist).toEqual([])
    expect(view.checklistMemo).toBeNull()
    expect(view.latestThesis).toBeNull()
    expect(view).not.toHaveProperty('priceSparkline')
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
        [],
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
      [],
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
      [],
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
      [],
      null,
    )

    expect(view.stance).toBe('판단 보류')
    expect(view.stanceConfidence).toBeNull()
  })

  it('maps report and thesis date-bearing DTOs', () => {
    expect(adaptReport(report).id).toBe('4')
    expect(adaptThesis(thesis).id).toBe('5')
  })
})
